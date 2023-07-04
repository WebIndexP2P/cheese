import terser from '@rollup/plugin-terser';
import gxImport from './rollup-gx-resolve.mjs'

export default {
  input: 'src/index.js',
  output: {
    file: 'build/index.js',
    format: 'iife',
    globals:{
      "ethereum-blockies": "window[\"ethereum-blockies-base64\"]",
      "ethers": "window.ethers",
      "libwip2p": "window.libwip2p",
      "libipfs": "window.libipfs",
      "wip2p-settings": "window.wip2pSettings"
    }
  },  
  external: ["wip2p-settings", "ethers", "libipfs", "libwip2p", "tweetnacl", "ethereum-blockies"],
  plugins: [gxImport(), terser() ]
}