import * as Y from "yjs";
const ydoc = new Y.Doc();
const ytext = ydoc.getText("content");
ytext.insert(0, "Hello from client 2 ");
console.log(Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString("base64"));