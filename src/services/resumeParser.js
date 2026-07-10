import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Setting up pdf.js worker using local file with Vite URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
You are a highly accurate Resume Parsing AI. 
Extract the information from the provided resume text into a strictly formatted JSON object. 
DO NOT INCLUDE ANY MARKDOWN formatting in your response (no \`\`\`json blocks). 
Return ONLY the raw JSON object.

Use this EXACT JSON schema. If information is missing, leave the string empty or the array empty. Do NOT invent or hallucinate data.

{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "mobile": "",
    "address": "",
    "linkedIn": "",
    "github": "",
    "portfolio": "",
    "dob": ""
  },
  "summary": {
    "careerObjective": "",
    "professionalSummary": ""
  },
  "skills": {
    "technical": [],
    "languages": [],
    "frameworks": [],
    "databases": [],
    "cloudPlatforms": [],
    "tools": [],
    "softSkills": []
  },
  "experience": [
    {
      "company": "",
      "jobTitle": "",
      "employmentType": "",
      "startDate": "",
      "endDate": "",
      "duration": "",
      "responsibilities": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "role": "",
      "duration": "",
      "responsibilities": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "branch": "",
      "college": "",
      "score": "",
      "graduationYear": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "organization": "",
      "date": ""
    }
  ],
  "languages": [],
  "achievements": []
}
`;

/**
 * Extracts text from a PDF file.
 */
async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(" ");
          fullText += pageText + "\\n";
        }
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts text from a DOCX file.
 */
async function extractTextFromDOCX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const arrayBuffer = this.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses the resume file and returns structured data.
 */
export async function parseResumeFile(file) {
  let text = "";
  
  if (file.type === "application/pdf") {
    text = await extractTextFromPDF(file);
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
    file.name.endsWith('.docx')
  ) {
    text = await extractTextFromDOCX(file);
  } else {
    throw new Error("Unsupported file format. Please upload a PDF or DOCX file.");
  }

  if (!text || text.trim() === "") {
    throw new Error("Could not extract any text from the file.");
  }

  // Call Gemini API
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });
    
    const result = await model.generateContent([
      "Parse this resume text and return the JSON object:\n\n" + text
    ]);
    
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting from Gemini response just in case
    let jsonString = responseText;
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '');
    }
    
    const parsedData = JSON.parse(jsonString);
    return parsedData;
    
  } catch (error) {
    console.error("Error during AI parsing:", error);
    throw new Error("Failed to parse resume content using AI. Please try again or enter details manually.");
  }
}
