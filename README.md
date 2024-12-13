# AlumniReach

AlumniReach is an AI-powered, all-in-one alumni networking platform that connects students and alumni, facilitating job searches and professional networking.

## Features

- **AI-Powered Resume Analysis**: Upload and analyze resumes to get personalized job and networking recommendations
- **Alumni Directory**: Search and connect with alumni based on industry, company, or job title
- **Job Board**: Browse and post job opportunities within the alumni network
- **Authentication**: Secure user authentication system with role-based access (student/alumni)
- **Profile Management**: Create and manage professional profiles

## Project Structure

```
AlumniReach/
├── HireHelper/                   # Data collection and processing
│   ├── py_files/                # Python scripts for data processing
│   │   ├── job_scraper.py      # Data extraction script
│   │   └── sort_text.py        # Text processing and sorting
│   ├── aws/                     # AWS configurations and Lambda functions
│   │   └── lambda/             # AWS Lambda function definitions
│   ├── csv(s)/                 # Processed CSV data files
│   ├── txt_files/              # Raw text and temporary data
│   ├── output/                 # Generated output files
│   └── API Testing.postman_collection.json # API test configurations
└── HireHelper_frontend/         # Frontend application
    ├── app/                     # React application
    │   ├── src/
    │   │   ├── components/     # React components
    │   │   ├── App.js         # Main application component
    │   │   └── index.js       # Application entry point
    └── amplify/                # AWS Amplify configuration
        └── backend/            # Backend resources
            └── function/       # Lambda functions
                └── analyzeResume # Resume analysis function
```

## Data Collection and Processing

The project utilizes data from various sources, primarily processed through the HireHelper directory:

### Data Sources
- **Handshake**: University job board data collected via web scraping
- **LinkedIn**: Alumni data collected using a custom Chrome extension
- **Job Descriptions**: Comprehensive job details stored in CSV format
- **Alumni Network**: Data stored and managed through AWS services

### Data Collection Method
The project uses a custom Chrome extension to gather data from both Handshake and LinkedIn:
1. **Chrome Extension**: 
   - Copies HTML content from specific pages on Handshake and LinkedIn
   - Captures structured data about jobs and alumni profiles
   - Saves raw HTML data for further processing
2. **Data Extraction**:
   - `job_scraper.py` and `sort_text.py` processes the HTML collected from Handshake and LinkedIn to extract job and alumni information
        -  Python scripts using regex patterns extract relevant information from the HTML
   - Automated parsing of job details, alumni profiles, and contact information
   - Structured data extraction for consistent formatting

### Data Processing Pipeline
1. **Collection**: 
   - HTML data collected from Handshake and LinkedIn using Chrome extension
   - Raw HTML processed using Python scripts to extract structured data
2. **Processing**:
   - Removal of duplicate job listings and alumni profiles
   - Filtering out expired job positions
   - Merging and standardizing job descriptions
   - Cleaning and formatting alumni data
   - Data validation and cleaning
3. **Storage**:
   - Processed data stored in CSV format
   - Data integrated with AWS services and SQL/FastAPI for frontend access
4. **Maintenance**:
   - Regular updates to remove expired listings
   - Duplicate detection and removal
   - Data quality verification

## Technologies Used

### Frontend
- React.js
- AWS Amplify
- React Router
- FontAwesome (for icons)
- CSS for styling

### Backend
- AWS Amplify
- AWS Lambda
- Amazon S3 (for resume storage)
- AWS AppSync (GraphQL API)
- Amazon Cognito (Authentication)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- AWS Account
- AWS Amplify CLI

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd AlumniReach
```

2. Install dependencies:
```bash
cd HireHelper_frontend/app
npm install
```

3. Configure AWS Amplify:
```bash
amplify configure
amplify init
```

4. Start the development server:
```bash
npm start
```

## Features in Detail

### Authentication
- User registration with email verification
- Role-based access control (Student/Alumni)
- Secure login system
- Password recovery

### Profile Management
- Create and edit professional profiles
- Upload and manage resumes
- View and update personal information

### Job Search
- Search jobs by title, company, or industry
- AI-powered job recommendations
- Save job searches
- Apply to jobs through the platform

### Alumni Network
- Search alumni by industry, company, or role
- View alumni profiles
- Connect with alumni
- Pagination for search results

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [nk3393@nyu.edu].
