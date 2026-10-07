import { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider } from 'styled-components'

import { GlobalStyle } from '../styles/global'
import { theme } from '../styles/theme'

const App: React.FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Meus Certificados | IFBA</title>
    </Head>
    <GlobalStyle />
    <Component {...pageProps} />
  </ThemeProvider>
)

export default App
