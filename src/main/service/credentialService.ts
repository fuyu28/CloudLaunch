import Store from "electron-store"
import type { Schema, Creds } from "../../types/creds"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const keytar = require("keytar")

const store = new Store<Schema>({
  defaults: {
    bucketName: "",
    region: "auto",
    endpoint: "",
    accessKeyId: ""
  }
})

const SERVICE = "StorageDeck"

export async function setCredential(creds: Creds): Promise<{ success: boolean }> {
  try {
    store.set("bucketName", creds.bucketName)
    store.set("region", creds.region)
    store.set("endpoint", creds.endpoint)
    store.set("accessKeyId", creds.accessKeyId)
    await keytar.setPassword(SERVICE, "secretAccessKey", creds.secretAccessKey)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false }
  }
}

export async function getCredential(): Promise<Creds | null> {
  const secret = await keytar.getPassword(SERVICE, "secretAccessKey")
  if (secret !== null) {
    return {
      bucketName: store.get("bucketName"),
      region: store.get("region"),
      endpoint: store.get("endpoint"),
      accessKeyId: store.get("accessKeyId"),
      secretAccessKey: secret
    }
  } else {
    return null
  }
}
