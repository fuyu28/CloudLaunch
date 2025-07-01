import { registerCredentialHandlers } from "./ipcHandlers/credentialHandlers"
import { registerDatabaseHandlers } from "./ipcHandlers/databaseHandlers"
import { registerDownloadSaveDataHandler } from "./ipcHandlers/downloadHandler"
import { registerFileDialogHandlers } from "./ipcHandlers/fileDialogHandlers"
import { registerSaveDataFolderListHandler } from "./ipcHandlers/saveDataFolderListHandler"
import { registerUploadSaveDataFolderHandlers } from "./ipcHandlers/uploadSaveDataFolderHandlers"

export function registerAllHandlers(): void {
  registerCredentialHandlers()
  registerDatabaseHandlers()
  registerDownloadSaveDataHandler()
  registerFileDialogHandlers()
  registerSaveDataFolderListHandler()
  registerUploadSaveDataFolderHandlers()
}
