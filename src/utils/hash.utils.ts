import crypto from "crypto"

export function generateMD5(string) {
  console.log("generateMD5 received string: ", string)
  return crypto.createHash("md5").update(string).digest("hex")
}
