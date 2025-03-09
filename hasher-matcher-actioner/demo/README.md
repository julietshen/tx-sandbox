# HMA Image Comparison Demo

This demo showcases the capabilities of the Hasher-Matcher-Actioner (HMA) library by providing an interactive web interface for comparing images using various algorithms.

## Features

- Upload and compare two images using HMA algorithms
- View similarity scores between images
- Interactive image editor with:
  - Cropping
  - Rotation
  - Filters
  - Text and emoji support
- Real-time comparison updates after edits

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- HMA library and its dependencies

## Setup

1. Install frontend dependencies:
   ```bash
   # Navigate to the demo directory
   cd hasher-matcher-actioner/demo
   
   # Install Node.js dependencies
   npm install
   ```

2. Set up Python virtual environment and install backend dependencies:
   ```bash
   # Navigate to the API directory
   cd api
   
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   
   # Install required packages
   pip install -r requirements.txt
   pip install -e ../..  # Install HMA from parent directory
   ```

## Running the Demo

1. Start the backend API server:
   ```bash
   # Make sure you're in the api directory and virtual environment is activated
   cd hasher-matcher-actioner/demo/api
   source venv/bin/activate
   python image_comparison.py
   ```
   The API will be available at `http://localhost:8000`
   - API documentation: `http://localhost:8000/docs`
   - Alternative API docs: `http://localhost:8000/redoc`

2. In a new terminal, start the frontend development server:
   ```bash
   # Navigate to the demo directory
   cd hasher-matcher-actioner/demo
   
   # Start the Next.js development server
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

3. Access the demo:
   - Open your browser and navigate to `http://localhost:3000`
   - The frontend will automatically connect to the backend API
   - If you see "Welcome to the Image Comparison API" message, you're all set!

## Usage

1. Upload two images using the upload buttons
2. View the similarity scores between the images
3. Use the editing tools to modify either image:
   - Click "Edit Image 1" or "Edit Image 2"
   - Use the available tools to modify the image
   - Click "Apply Changes" to see how the modifications affect the similarity scores

## Architecture

- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: FastAPI with Python
- Image Processing: HMA library with PDQ algorithm support

## Troubleshooting

- If port 8000 is already in use, the backend will automatically try to find an available port
- If port 3000 is in use, the frontend will try ports 3001, 3002, etc.
- Make sure both servers are running simultaneously
- Check the terminal output for any error messages

## Contributing

Feel free to submit issues and enhancement requests! 