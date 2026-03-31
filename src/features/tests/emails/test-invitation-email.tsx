import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function TestInvitationEmail(props: {
  ownerName: string;
  recipientEmail: string;
  testTitle: string;
  invitationUrl: string;
}) {
  const { invitationUrl, ownerName, recipientEmail, testTitle } = props;

  return (
    <Html>
      <Head />
      <Preview>{ownerName} shared a test with you</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re invited to take a test</Heading>
          <Text style={paragraph}>
            {ownerName} invited you to take <strong>{testTitle}</strong>.
          </Text>
          <Section style={buttonSection}>
            <Button href={invitationUrl} style={button}>
              Open invitation
            </Button>
          </Section>
          <Text style={paragraph}>
            Sign in or create an account with <strong>{recipientEmail}</strong> to open the test.
          </Text>
          <Text style={footer}>If the button does not work, open this link: {invitationUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f5f1e8",
  color: "#1c1814",
  fontFamily: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: "32px 16px",
};

const container = {
  backgroundColor: "#fffdf8",
  border: "1px solid #ded3bf",
  borderRadius: "20px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "600",
  letterSpacing: "-0.03em",
  lineHeight: "1.1",
  margin: "0 0 20px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const buttonSection = {
  padding: "12px 0 24px",
};

const button = {
  backgroundColor: "#1c1814",
  borderRadius: "999px",
  color: "#fffdf8",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "14px 22px",
  textDecoration: "none",
};

const footer = {
  color: "#6d6457",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "8px 0 0",
};
