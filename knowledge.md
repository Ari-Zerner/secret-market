The goal of this project is to create a website that will allow Manifold users to create a market with secret resolution criteria.
Implementation will require several steps:

Manifold API endpoints used:
- GET https://api.manifold.markets/v0/market/{id} - Get market details
- POST https://api.manifold.markets/v0/market/{id} - Update market description
- POST https://api.manifold.markets/v0/market - Create new market

1. Create an API that takes the information for the market and makes a Manifold market:
   - The market should have the title "Secret Market <hash>"
   - The market should have the description "This market has a secret resolution criteria. The hash of the resolution criteria is <hash>.\n\nCreated with <link to this project>."
   - The market will be created under the user's account using the user's API key.
2. Create a frontend that collects the necessary information from the user.
   - The frontend should also explain how secret markets work.
   - Errors should be handled gracefully and reported to the user.
3. ✓ Use MongoDB to store the market description encrypted using symmetric encryption keyed to the user's API key.
   - The unique ID of the Manifold market is used as a field in the document
   - Market descriptions are encrypted using AES with the user's API key
   - Database connection string should be provided in MONGODB_URI environment variable
   - Database is source of truth for whether a market is a secret market
   - Manifold API only used for supplementary market info (title, URL)
   - All encryption, decryption, and Manifold API calls done client-side
   - Server only stores and transmits encrypted data
   - API keys never leave the browser
   - Plaintext resolution criteria never transmitted over the network
4. ✓ Add frontend options to reveal the original market description to the user and to reveal the market outcome publicly by editing the market description.
   - Added "View Secret Description" button to privately view criteria
   - Added "Reveal Publicly" button with confirmation dialog
   - Market description is updated on Manifold when revealed
5. Create a README.md file that explains how to use the project.

UI Guidelines:
- Support both light and dark modes using dark: variants
- Maintain WCAG contrast ratios in both modes
- Use semantic colors (e.g. gray-900 dark:gray-100 for main text)
- Ensure error/success states are visible in both modes
- Clear error messages when user takes corrective action
- Avoid input defocusing: wrap inputs in <form> elements to preserve focus during state updates
- For input fields with toggle buttons (e.g. show/hide password):
  - Add `pr-16` padding to prevent text from overlapping with the button
  - Position button absolutely within a relative container
  - Use consistent button styling: `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
- When using localStorage in Next.js, check for window to prevent SSR issues:
  ```ts
  const [value] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('key') || '';
    }
    return '';
  });
  ```

Next.js App Router Guidelines:
- Log all Manifold API errors with endpoint, status, error, and error.details
- Use ManifoldAPIError type for error responses: { message: string; details?: { [key: string]: unknown } }
- Use absolute imports from app directory with @/app prefix, e.g. '@/app/lib/db/types'
- Pass through API error messages for easier debugging
- Use useParams() hook instead of props.params in client components
- For server components, use React.use(params) to unwrap params promise
- Keep route handlers (app/api/*) as server-side code
- Route handlers:
  ```ts
  // In app/api/[param]/route.ts
  export async function GET(request: NextRequest) {
    // Get dynamic param from URL
    const { param } = request.nextUrl.pathname.match(/\/api\/(?<param>[^\/]+)/)?.groups ?? {};
    // Handler code
  }
  ```
