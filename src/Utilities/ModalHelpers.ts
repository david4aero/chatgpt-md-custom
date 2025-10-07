import { App } from "obsidian";

import { FolderCreationModal } from "src/Views/FolderCreationModal";

export const createFolderModal = async (app: App, folderName: string, folderPath: string): Promise<boolean> => {
  const folderCreationModal = new FolderCreationModal(app, folderName, folderPath);

  folderCreationModal.open();
  const result = await folderCreationModal.waitForModalValue();

  if (result) {
    console.log("[ChatMDCustom] Creating folder");
    await app.vault.createFolder(folderPath);
  } else {
    console.log("[ChatMDCustom] Not creating folder");
  }

  return result;
};
