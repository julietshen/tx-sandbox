# HMA Image Comparison Demo

This demo showcases the capabilities of the Hasher-Matcher-Actioner (HMA) library by providing an interactive web interface for comparing images using various algorithms.

## Features

- Upload and compare two images using HMA algorithms
- View similarity scores between images
- Interactive image editor with:
  - Cropping
  - Rotation
  - Filters
- Real-time comparison updates after edits

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- HMA library and its dependencies

## Setup

1. Install frontend dependencies:
   ```bash
   cd demo
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd api
   pip install -r requirements.txt
   pip install -e ../..  # Install HMA from parent directory
   ```

## Running the Demo

1. Start the backend server:
   ```bash
   cd api
   python image_comparison.py
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd demo
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

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

## Contributing

Feel free to submit issues and enhancement requests! 
