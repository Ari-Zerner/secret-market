# Secret Market Creator

Create Manifold markets with hidden resolution criteria. This allows for creating markets where knowing the resolution criteria would affect betting behavior.

## Features

- Create markets with encrypted resolution criteria
- View your secret criteria privately
- Reveal criteria publicly when ready
- Secure encryption using your API key
- Proof of criteria via SHA-256 hash

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
MONGODB_URI=your_mongodb_connection_string
```

3. Run the development server:
```bash
npm run dev
```

## Usage

1. Get your Manifold API key from your profile settings
2. Create a market:
   - Enter your API key
   - Provide a market title
   - Enter the secret resolution criteria
   - Click "Create Secret Market"

3. Managing your market:
   - Use "View Secret Description" to privately check the criteria
   - Use "Reveal Publicly" when ready to make the criteria public
   - The criteria hash proves the criteria wasn't changed

## Security

- Resolution criteria are encrypted using AES-256
- Your API key is used as the encryption key
- Criteria are never stored in plaintext
- Hashes provide proof of unchanged criteria

## Development

Built with:
- Next.js 13 App Router
- MongoDB for secure storage
- CryptoJS for encryption
- Tailwind CSS for styling

## License

MIT
