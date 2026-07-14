import * as Y from "yjs";

const ydoc = new Y.Doc();
const ytext = ydoc.getText("content");
ytext.insert(0, "Hello from client 1");

const update = Y.encodeStateAsUpdate(ydoc);
console.log(Buffer.from(update).toString("base64"));