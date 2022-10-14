import { ChakraProvider } from '@chakra-ui/react';
import { createClient, configureChains, defaultChains, WagmiConfig } from 'wagmi';
import { extendTheme } from '@chakra-ui/react';
import { publicProvider } from 'wagmi/providers/public';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import Web3 from 'web3';
import "./style.css";

const { provider, webSocketProvider } = configureChains(defaultChains, [publicProvider()]);

const client = createClient({
  provider,
  webSocketProvider,
  autoConnect: true,
});

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

const MyApp = ({ Component, pageProps }: AppProps) => {

  function getLibrary(provider_: any) {
    return new Web3(provider_)
  }

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ChakraProvider resetCSS theme={theme}>
        <WagmiConfig client={client}>
          <SessionProvider session={pageProps.session} refetchInterval={0}>
            <Component {...pageProps} />
          </SessionProvider>
        </WagmiConfig>
      </ChakraProvider>
    </Web3ReactProvider>
  );
};

export default MyApp;
