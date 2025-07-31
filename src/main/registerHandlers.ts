import { registerChapterHandlers } from "./ipcHandlers/chapterHandlers"
import { registerCloudDataHandlers } from "./ipcHandlers/cloudDataHandlers"
import { registerCredentialHandlers } from "./ipcHandlers/credentialHandlers"
import { registerDatabaseHandlers } from "./ipcHandlers/databaseHandlers"
import { registerDownloadSaveDataHandler } from "./ipcHandlers/downloadHandler"
import { registerErrorReportHandlers } from "./ipcHandlers/errorReportHandlers"
import { registerFileDialogHandlers } from "./ipcHandlers/fileHandlers"
import { registerLaunchGameHandlers } from "./ipcHandlers/launchGameHandlers"
import { registerLoadImageHandler } from "./ipcHandlers/loadImageHandler"
import { registerMemoHandlers } from "./ipcHandlers/memoHandlers"
import { registerProcessMonitorHandlers } from "./ipcHandlers/processMonitorHandlers"
import { registerSaveDataFolderListHandler } from "./ipcHandlers/saveDataFolderListHandler"
import { registerSettingsHandlers } from "./ipcHandlers/settingsHandlers"
import { registerUploadSaveDataFolderHandlers } from "./ipcHandlers/uploadSaveDataFolderHandlers"

export function registerAllHandlers(): void {
  registerChapterHandlers()
  registerCloudDataHandlers()
  registerCredentialHandlers()
  registerDatabaseHandlers()
  registerDownloadSaveDataHandler()
  registerFileDialogHandlers()
  registerLaunchGameHandlers()
  registerLoadImageHandler()
  registerMemoHandlers()
  registerProcessMonitorHandlers()
  registerSaveDataFolderListHandler()
  registerSettingsHandlers()
  registerUploadSaveDataFolderHandlers()
  registerErrorReportHandlers()
}
