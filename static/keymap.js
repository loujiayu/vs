import mousetrap from 'mousetrap'
import fs from 'fs-plus'

export default class KeymapManager {
  constructor(filePath) {
    this.filePath = filePath
  }
  loadKeymaps() {
    try {
      keymaps = JSON.parse(fs.readFileSync(this.filePath))
    } catch (e) {
      console.error(e);
      return
    }
  }
}
