import './globals.css'

export const metadata = {
  title: 'HMA Comparison Tool',
  description: 'Compare images using multiple hashing algorithms for safety and security',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
          crossOrigin="anonymous" 
        />
        <meta name="theme-color" content="#1a237e" />
        <meta name="description" content="HMA Comparison Tool - Compare images using multiple hashing algorithms for safety and security" />
      </head>
      <body>
        {/* Skip to main content link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="bg-warning bg-opacity-25">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h4 py-3 mb-0 text-dark">HMA Comparison Tool</h1>
              <div className="text-end">
                <span className="text-dark">Safety Tools</span>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="min-vh-100" role="main">
          {children}
        </main>

        {/* Accessibility announcement region for dynamic content */}
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
          id="a11y-announcer"
        ></div>

        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" 
          crossOrigin="anonymous"
        />
      </body>
    </html>
  )
}
