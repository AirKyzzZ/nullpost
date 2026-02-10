import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  try {
    const result = await getSession()

    if (!result) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        encryptionSalt: result.user.encryptionSalt,
        encryptionVerifier: result.user.encryptionVerifier,
        encryptionVerifierIv: result.user.encryptionVerifierIv,
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 },
    )
  }
}
