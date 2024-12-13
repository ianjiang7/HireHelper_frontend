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

// GPT Prompt
const ANALYSIS_PROMPT = `You are a professional resume reviewer. Provide a comprehensive, professional, and constructive analysis of the submitted resume, focusing on improving its effectiveness for job applications.
Analyze the resume across the following critical dimensions:
1. Overall Structure and Formatting

Assess visual hierarchy and readability
Evaluate consistency in formatting
Check for appropriate use of white space
Identify any design or layout issues that may distract from content

2. Content Evaluation
Professional Summary/Objective

Assess clarity and impact
Verify alignment with target career goals
Check for specificity and unique value proposition

Work Experience

Evaluate description of roles and responsibilities
Assess quantification of achievements
Check for action verbs and results-oriented language
Identify potential areas for more impactful descriptions

Skills Section

Review relevance to target industry/role
Check for both hard and soft skills
Assess depth and breadth of skill representation


3. Keyword and ATS Optimization

Analyze alignment with potential job descriptions
Check for industry-specific keywords
Assess compatibility with Applicant Tracking Systems (ATS)

4. Potential Red Flags

Identify potential gaps or inconsistencies
Check for unexplained employment periods
Assess potential areas of concern for recruiters

Output Requirements
Provide feedback in a clear, concise format:

Maximum 500 words
Use a structured feedback approach
Prioritize most critical improvement areas
Offer specific, actionable recommendations
Use a professional and constructive tone

Scoring System (Add at the top)
Provide a brief scoring in these key areas:

Overall Effectiveness: /10
Content Quality: /10
Formatting: /10
ATS Compatibility: /10

Final Resume Review Recommendation
Conclude with:
Top 3 recommended improvements
Potential impact on job application success

Additionally add

Job Fit Recommendations (Recommendations to help with job search)
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
    - Role (Choose one of these roles: Intern, Employee, Manager, Director that fit the candidate (college students in their sophomore or junior years should be matched with Intern, calculate what standing they are by accessing the current year and comparing to their graduation date))
    - Job Title (Choose up to 3 real job titles for each of the matched i

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
