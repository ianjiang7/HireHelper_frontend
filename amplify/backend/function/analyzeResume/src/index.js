import OpenAI from 'openai';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pkg from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument } = pkg;

// Required for PDF.js
globalThis.pdfjsLib = { getDocument };

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const s3Client = new S3Client({ 
    region: "us-east-1",
    // Force path style for more reliable access
    forcePathStyle: true,
    // Disable bucket validation to avoid ListBucket calls
    useArnRegion: true,
    disableMultiregionAccessPoints: true,
    useFipsEndpoint: false
});

const ANALYSIS_PROMPT = `
Please analyze this resume and extract the following information in a clear, structured format:

1. Big Green Flags (Only list if found)
    - Industry specific skills
    - Industry experience (highlight notable companies)
    - Complexity of work described in resume
    - References and proof of work (publications, notable people mentioned) 
    - High levels of influence within work

    a. Hard Skills (Only list if found)
        - Technical skills
        - Tools & technologies
        - Certifications
        - Programming languages
        - Software proficiency

    b. Soft Skills (Only list if found)
        - Leadership abilities
        - Communication skills
        - Team collaboration
        - Problem-solving abilities
        - Other interpersonal skills

6. Big Red Flags (Only list if found)
    - Gaps in Employment
    - Quick Changes in Employment
    - Education is not the same work industry experience
    - College GPA is not included or
        a. is below a 3.5 (ok)
        b. is below a 3.2 (bad)
        c. is below a 3.0 (unacceptable)

7. Small Red Flags (Only list if found)
    - Weasel Words (word or phrase used to create the impression that something specific and meaningful has been said, when in fact the claim is vague, ambiguous, or irrelevant)
    - References are missing
    - Address is not in the same country as job
    - Grammatical errors

8. Job Fit Recommendations (Recommendations to help with job search)
    - Industry (Choose up to 3 industries from this list: Accounting
        Advertising, PR & Marketing
        Aerospace
        Agriculture
        Animal & Wildlife
        Architecture and Planning
        Automotive
        Biotech & Life Sciences
        Civil Engineering
        Commercial Banking & Credit
        Computer Networking
        Construction
        CPG - Consumer Packaged Goods
        Defense
        Design
        Electronic & Computer Hardware
        Energy
        Engineering & Construction
        Environmental Services
        Farming, Ranching and Fishing
        Fashion
        Financial Services
        Food & Beverage
        Forestry
        Government - Consulting
        Government - Intelligence
        Government - Local, State & Federal
        Healthcare
        Higher Education
        Hotels & Accommodation
        Human Resources
        Information Technology
        Insurance
        Interior Design
        International Affairs
        Internet & Software
        Investment / Portfolio Management
        Investment Banking
        Journalism, Media & Publishing
        K-12 Education
        Landscaping
        Legal & Law Enforcement
        Library Services
        Management Consulting
        Manufacturing
        Medical Devices
        Movies, TV, Music
        Natural Resources
        NGO
        Non-Profit - Other
        Oil & Gas
        Other Education
        Other Industries
        Performing and Fine Arts
        Pharmaceuticals
        Politics
        Real Estate
        Religious Work
        Research
        Restaurants & Food Service
        Retail Stores
        Sales & Marketing
        Scientific and Technical Consulting
        Social Assistance
        Sports & Leisure
        Staffing & Recruiting
        Summer Camps/Outdoor Recreation
        Telecommunications
        Tourism
        Transportation & Logistics
        Utilities and Renewable Energy
        Veterinary
        Wholesale Trade
        that fit the candidate)
    - Job Title (Choose up to 3 real job titles for each of the matched industries that fit the candidate)
    - Role (Choose one of these roles: Intern, Employee, Manager, Director that fit the candidate (college students in their sophomore or junior years should be matched with Intern))
    - Companies (Choose up to 20 companies that fit the candidate)

Please format the response in a clear, bulleted structure.
`;

async function extractTextFromPDF(pdfBuffer) {
    try {
        // Convert Buffer to Uint8Array for PDF.js
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // Load the PDF document
        const loadingTask = getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Iterate through each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n';
        }
        
        if (!fullText.trim()) {
            throw new Error('Extracted text is empty');
        }
        
        return fullText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

async function getFileFromS3(bucket, key) {
    try {
        // Direct GetObject call without any validation
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            // Add explicit parameters to avoid validation
            ExpectedBucketOwner: '677276120566'
        });

        let response;
        try {
            response = await s3Client.send(command);
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                throw new Error('Resume file not found');
            }
            throw error;
        }

        // Stream to buffer
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error('Error getting file from S3:', error);
        throw new Error(`Failed to get resume from S3: ${error.message}`);
    }
}

export const handler = async (event) => {
    console.log('Lambda function started');
    console.log('Full event:', JSON.stringify(event, null, 2));

    try {
        if (!event.arguments?.input) {
            console.log('No input provided');
            return {
                success: false,
                analysis: null,
                error: "No input provided"
            };
        }

        const { userId, s3Path } = event.arguments.input;
        console.log('Processing resume for:', { userId, s3Path });
        
        if (!userId || !s3Path) {
            console.log('Missing required fields');
            return {
                success: false,
                analysis: null,
                error: "Missing required input fields (userId or s3Path)"
            };
        }

        try {
            const bucket = "alumnireachresumestorage74831-dev";
            console.log('Getting file from S3:', { bucket, key: s3Path });

            // Get the PDF file from S3
            const pdfBuffer = await getFileFromS3(bucket, s3Path);
            console.log('PDF buffer size:', pdfBuffer.length);
            
            // Extract text from PDF
            const resumeText = await extractTextFromPDF(pdfBuffer);
            console.log('Extracted text length:', resumeText.length);
            
            if (!resumeText || resumeText.trim().length === 0) {
                throw new Error('No text could be extracted from the PDF');
            }
            
            // Analyze with OpenAI
            console.log('Calling OpenAI...');
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional resume analyzer. Analyze the resume text and provide detailed insights."
                    },
                    {
                        role: "user",
                        content: ANALYSIS_PROMPT + "\n\nResume Text:\n" + resumeText
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            const analysis = completion.choices[0].message.content;
            console.log('Analysis complete, length:', analysis.length);

            return {
                success: true,
                analysis: analysis,
                error: null
            };

        } catch (error) {
            console.error('Error processing resume:', error);
            console.error('Error stack:', error.stack);
            return {
                success: false,
                analysis: null,
                error: `Error processing resume: ${error.message}`
            };
        }
    } catch (error) {
        console.error('Lambda execution error:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            analysis: null,
            error: `Internal server error: ${error.message}`
        };
    }
};
