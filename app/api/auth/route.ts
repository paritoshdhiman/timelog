import { NextResponse } from "next/server"

// OAuth 2.0 token endpoint
const TOKEN_URL = "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/oauth/token"
const CLIENT_ID = "zoG0mmekFopCNGCYR1rs0A.."
const CLIENT_SECRET = "URnLea_-tINt2EBgejc2Aw.."

export async function POST() {
  try {
    // Create Basic Auth header for OAuth 2.0 client authentication
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
    const authHeader = `Basic ${credentials}`

    // Create form data for OAuth 2.0 token request
    const formData = new URLSearchParams()
    formData.append("grant_type", "client_credentials")

    console.log("Server-side: Requesting OAuth 2.0 token with client credentials grant")

    // Make the OAuth 2.0 token request
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
    })

    // Handle non-successful responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Server-side: OAuth 2.0 token response error:", errorText)
      return NextResponse.json(
        { error: `Failed to get OAuth 2.0 token: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Server-side: Successfully obtained OAuth 2.0 token")

    return NextResponse.json(data)
  } catch (error) {
    console.error("Server-side: Error getting OAuth 2.0 token:", error)
    return NextResponse.json({ error: "Failed to fetch OAuth token" }, { status: 500 })
  }
}

