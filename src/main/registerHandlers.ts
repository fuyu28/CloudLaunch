import { registerCredentialHandlers } from "./ipcHandlers/credentialHandlers"
import { registerDatabaseHandlers } from "./ipcHandlers/databaseHandlers"
import { registerDownloadSaveDataHandler } from "./ipcHandlers/downloadHandler"
import { registerFileDialogHandlers } from "./ipcHandlers/fileHandlers"
import { registerLaunchGameHandlers } from "./ipcHandlers/launchGameHandlers"
import { registerLoadImageHandler } from "./ipcHandlers/loadImageHandler"
import { registerProcessMonitorHandlers } from "./ipcHandlers/processMonitorHandlers"
import { registerSaveDataFolderListHandler } from "./ipcHandlers/saveDataFolderListHandler"
import { registerUploadSaveDataFolderHandlers } from "./ipcHandlers/uploadSaveDataFolderHandlers"

export function registerAllHandlers(): void {
  registerCredentialHandlers()
  registerDatabaseHandlers()
  registerDownloadSaveDataHandler()
  registerFileDialogHandlers()
  registerLaunchGameHandlers()
  registerLoadImageHandler()
  registerProcessMonitorHandlers()
  registerSaveDataFolderListHandler()
  registerUploadSaveDataFolderHandlers()
}
