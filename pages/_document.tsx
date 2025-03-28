import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

// Import the mkdirs script to ensure directories are created during build
import '../components/mkdirs';

class MyDocument extends Document {
  override render(): React.ReactElement {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 