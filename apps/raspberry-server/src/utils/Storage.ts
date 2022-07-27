import fs from "fs";
import { unlink } from "fs/promises";
import path from "path";
export default class Storage {
  public store(filePath: string) {
    const completePath = this.makeCompletePath(filePath);
    const folders = path.dirname(completePath);
    if (!fs.existsSync(folders)) {
      fs.mkdirSync(folders, { recursive: true });
    }
    return fs.createWriteStream(completePath);
  }

  public makeCompletePath(filePath: string) {
    return path.resolve(filePath);
  }

  async delete(path: string) {
    await unlink(this.makeCompletePath(path));
  }
}
