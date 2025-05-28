import "./globals.css";
import KeycloakProviderWrapper from "./components/KeycloakProviderWrapper";

export const metadata = {
  title: "Quiz App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <KeycloakProviderWrapper>{children}</KeycloakProviderWrapper>
      </body>
    </html>
  );
}
