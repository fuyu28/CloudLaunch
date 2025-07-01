import { registerCredentialHandler } from "./ipcHandlers/credentialHandler"
import { registerDatabaseHandler } from "./ipcHandlers/databaseHandler"
import { registerDownloadHandlers } from "./ipcHandlers/downloadHandler"
import { registerFileDialogHandler } from "./ipcHandlers/fileDialogHandlers"
import { registerGetR2FolderListHandler } from "./ipcHandlers/getR2FolderListHandler"
import { registerUploadHandlers } from "./ipcHandlers/uploadHandlers"

export function registerAllHandlers(): void {
  registerFileDialogHandler()
  registerUploadHandlers()
  registerDownloadHandlers()
  registerGetR2FolderListHandler()
  registerCredentialHandler()
  registerDatabaseHandler()
}
