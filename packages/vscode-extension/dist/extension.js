"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../core/dist/protocol.js
var require_protocol = __commonJS({
  "../core/dist/protocol.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Methods = exports2.ErrorCodes = void 0;
    exports2.createRequest = createRequest;
    exports2.createNotification = createNotification2;
    exports2.createSuccessResponse = createSuccessResponse2;
    exports2.createErrorResponse = createErrorResponse2;
    exports2.isRequest = isRequest2;
    exports2.isNotification = isNotification2;
    exports2.isResponse = isResponse;
    exports2.isErrorResponse = isErrorResponse;
    exports2.ErrorCodes = {
      PARSE_ERROR: -32700,
      INVALID_REQUEST: -32600,
      METHOD_NOT_FOUND: -32601,
      INVALID_PARAMS: -32602,
      INTERNAL_ERROR: -32603,
      // Custom error codes (application-specific)
      NO_ACTIVE_EDITOR: -32001,
      FILE_NOT_FOUND: -32002,
      PERMISSION_DENIED: -32003,
      TIMEOUT: -32004
    };
    exports2.Methods = {
      // Editor operations (CLI → IDE)
      EDITOR_GET_TEXT: "editor/getText",
      EDITOR_GET_SELECTION: "editor/getSelection",
      EDITOR_SET_CURSOR: "editor/setCursor",
      EDITOR_APPLY_EDIT: "editor/applyEdit",
      EDITOR_HIGHLIGHT: "editor/highlight",
      // Workspace operations (CLI → IDE)
      WORKSPACE_OPEN_FILE: "workspace/openFile",
      WORKSPACE_GET_DIAGNOSTICS: "workspace/getDiagnostics",
      WORKSPACE_GET_OPEN_FILES: "workspace/getOpenFiles",
      // Command execution (CLI → IDE)
      COMMAND_EXECUTE: "command/execute",
      // Terminal operations (CLI → IDE)
      TERMINAL_SEND_TEXT: "terminal/sendText",
      // Window operations (CLI → IDE)
      WINDOW_SHOW_MESSAGE: "window/showMessage",
      WINDOW_SHOW_QUICK_PICK: "window/showQuickPick",
      // Notifications (IDE → CLI)
      EDITOR_ON_CHANGE: "editor/onChange",
      EDITOR_ON_SAVE: "editor/onSave",
      EDITOR_ON_ACTIVE_CHANGE: "editor/onActiveChange",
      // Meta
      PING: "ping",
      GET_INFO: "getInfo"
    };
    var _nextId = 1;
    function createRequest(method, params) {
      return {
        jsonrpc: "2.0",
        id: _nextId++,
        method,
        params
      };
    }
    function createNotification2(method, params) {
      return {
        jsonrpc: "2.0",
        method,
        params
      };
    }
    function createSuccessResponse2(id, result) {
      return {
        jsonrpc: "2.0",
        id,
        result
      };
    }
    function createErrorResponse2(id, code, message, data) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code, message, data }
      };
    }
    function isRequest2(msg) {
      return "method" in msg && "id" in msg;
    }
    function isNotification2(msg) {
      return "method" in msg && !("id" in msg);
    }
    function isResponse(msg) {
      return "id" in msg && !("method" in msg);
    }
    function isErrorResponse(msg) {
      return "error" in msg;
    }
  }
});

// ../core/dist/socket-utils.js
var require_socket_utils = __commonJS({
  "../core/dist/socket-utils.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2)
            if (Object.prototype.hasOwnProperty.call(o2, k))
              ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule)
          return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++)
            if (k[i] !== "default")
              __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BridgeClient = exports2.MessageReader = exports2.BRIDGE_VERSION = exports2.BRIDGE_INFO_PATH = exports2.BRIDGE_SOCKET_PATH = exports2.BRIDGE_DIR = void 0;
    exports2.scanForVSCodeSockets = scanForVSCodeSockets;
    exports2.findBridgeSocket = findBridgeSocket;
    exports2.isSocketAlive = isSocketAlive;
    exports2.discoverAllSockets = discoverAllSockets;
    exports2.frameMessage = frameMessage2;
    exports2.getIPCExportCommand = getIPCExportCommand;
    exports2.generateAutoInjectScript = generateAutoInjectScript;
    var net2 = __importStar(require("net"));
    var fs2 = __importStar(require("fs"));
    var path = __importStar(require("path"));
    var os = __importStar(require("os"));
    exports2.BRIDGE_DIR = path.join(os.homedir(), ".bidirection");
    exports2.BRIDGE_SOCKET_PATH = path.join(exports2.BRIDGE_DIR, "bridge.sock");
    exports2.BRIDGE_INFO_PATH = path.join(exports2.BRIDGE_DIR, "bridge.info");
    exports2.BRIDGE_VERSION = "1.0.0";
    function scanForVSCodeSockets() {
      const results = [];
      const searchDirs = [];
      if (process.platform === "darwin") {
        const tmpDir = process.env.TMPDIR || "/tmp";
        searchDirs.push(tmpDir);
        searchDirs.push(path.join(os.tmpdir()));
      } else {
        const uid = process.getuid?.();
        if (uid !== void 0) {
          searchDirs.push(`/run/user/${uid}`);
        }
        searchDirs.push("/tmp");
        searchDirs.push(os.tmpdir());
      }
      const uniqueDirs = [...new Set(searchDirs.map((d) => fs2.realpathSync(d)))];
      for (const dir of uniqueDirs) {
        try {
          const files = fs2.readdirSync(dir);
          for (const file of files) {
            if (file.startsWith("vscode-ipc-") && file.endsWith(".sock")) {
              const fullPath = path.join(dir, file);
              try {
                const stat = fs2.statSync(fullPath);
                results.push({
                  path: fullPath,
                  type: "vscode-ipc",
                  age: Date.now() - stat.mtimeMs,
                  active: false
                  // Will be checked later
                });
              } catch {
              }
            }
          }
        } catch {
        }
      }
      results.sort((a, b) => a.age - b.age);
      return results;
    }
    function findBridgeSocket() {
      try {
        if (fs2.existsSync(exports2.BRIDGE_INFO_PATH)) {
          const info = JSON.parse(fs2.readFileSync(exports2.BRIDGE_INFO_PATH, "utf-8"));
          if (info.socketPath && fs2.existsSync(info.socketPath)) {
            return {
              path: info.socketPath,
              type: "bidirection-bridge",
              age: Date.now() - (info.startedAt || Date.now()),
              active: false
              // Will be checked
            };
          }
        }
        if (fs2.existsSync(exports2.BRIDGE_SOCKET_PATH)) {
          return {
            path: exports2.BRIDGE_SOCKET_PATH,
            type: "bidirection-bridge",
            age: 0,
            active: false
          };
        }
      } catch {
      }
      return null;
    }
    async function isSocketAlive(socketPath, timeoutMs = 2e3) {
      return new Promise((resolve) => {
        const client = net2.createConnection({ path: socketPath }, () => {
          client.destroy();
          resolve(true);
        });
        client.on("error", () => resolve(false));
        client.setTimeout(timeoutMs, () => {
          client.destroy();
          resolve(false);
        });
      });
    }
    async function discoverAllSockets() {
      const sockets = [];
      const bridge = findBridgeSocket();
      if (bridge) {
        bridge.active = await isSocketAlive(bridge.path);
        sockets.push(bridge);
      }
      const vscodeSockets = scanForVSCodeSockets();
      for (const sock of vscodeSockets) {
        sock.active = await isSocketAlive(sock.path);
        sockets.push(sock);
      }
      return sockets;
    }
    function frameMessage2(message) {
      const payload = JSON.stringify(message);
      const payloadBytes = Buffer.from(payload, "utf-8");
      const header = Buffer.alloc(4);
      header.writeUInt32BE(payloadBytes.length, 0);
      return Buffer.concat([header, payloadBytes]);
    }
    var MessageReader2 = class {
      constructor(onMessage, onError = () => {
      }) {
        this.buffer = Buffer.alloc(0);
        this.onMessage = onMessage;
        this.onError = onError;
      }
      /**
       * Feed incoming data from the socket. May trigger zero or more message callbacks.
       */
      feed(data) {
        this.buffer = Buffer.concat([this.buffer, data]);
        while (this.buffer.length >= 4) {
          const payloadLength = this.buffer.readUInt32BE(0);
          if (payloadLength > 50 * 1024 * 1024) {
            this.onError(new Error(`Message too large: ${payloadLength} bytes`));
            this.buffer = Buffer.alloc(0);
            return;
          }
          if (this.buffer.length < 4 + payloadLength) {
            break;
          }
          const payload = this.buffer.slice(4, 4 + payloadLength).toString("utf-8");
          this.buffer = this.buffer.slice(4 + payloadLength);
          try {
            const message = JSON.parse(payload);
            this.onMessage(message);
          } catch (err) {
            this.onError(new Error(`Failed to parse message: ${err}`));
          }
        }
      }
      /** Reset the internal buffer */
      reset() {
        this.buffer = Buffer.alloc(0);
      }
    };
    exports2.MessageReader = MessageReader2;
    var BridgeClient = class {
      constructor(options = {}) {
        this.socket = null;
        this.pendingRequests = /* @__PURE__ */ new Map();
        this.notificationHandlers = /* @__PURE__ */ new Map();
        this.connected = false;
        this.socketPath = options.socketPath || exports2.BRIDGE_SOCKET_PATH;
        this.explicitSocketPath = !!options.socketPath;
        this.timeout = options.timeout || 1e4;
        this.reader = new MessageReader2((msg) => this.handleMessage(msg), (err) => console.error("[BiDirection] Parse error:", err.message));
      }
      /** Connect to the bridge socket */
      async connect() {
        return new Promise((resolve, reject) => {
          if (!this.explicitSocketPath) {
            try {
              if (fs2.existsSync(exports2.BRIDGE_INFO_PATH)) {
                const info = JSON.parse(fs2.readFileSync(exports2.BRIDGE_INFO_PATH, "utf-8"));
                if (info.socketPath) {
                  this.socketPath = info.socketPath;
                }
              }
            } catch {
            }
          }
          this.socket = net2.createConnection({ path: this.socketPath }, () => {
            this.connected = true;
            this.socket?.unref();
            resolve();
          });
          this.socket.on("data", (data) => this.reader.feed(data));
          this.socket.on("error", (err) => {
            if (!this.connected) {
              reject(err);
            }
          });
          this.socket.on("close", () => {
            this.connected = false;
            for (const [id, pending] of this.pendingRequests) {
              clearTimeout(pending.timer);
              pending.reject(new Error("Connection closed"));
              this.pendingRequests.delete(id);
            }
          });
        });
      }
      /** Send a JSON-RPC request and wait for the response */
      async request(method, params) {
        if (!this.socket || !this.connected) {
          throw new Error("Not connected to bridge");
        }
        const id = Date.now() + Math.random();
        const message = {
          jsonrpc: "2.0",
          id,
          method,
          params
        };
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pendingRequests.delete(id);
            reject(new Error(`Request timeout: ${method}`));
          }, this.timeout);
          this.pendingRequests.set(id, {
            resolve,
            reject,
            timer
          });
          this.socket.write(frameMessage2(message));
        });
      }
      /** Register a handler for server-sent notifications */
      onNotification(method, handler) {
        this.notificationHandlers.set(method, handler);
      }
      /** Disconnect from the bridge */
      disconnect() {
        if (this.socket) {
          this.socket.destroy();
          this.socket = null;
          this.connected = false;
        }
      }
      /** Check if connected */
      isConnected() {
        return this.connected;
      }
      handleMessage(msg) {
        if ("id" in msg && !("method" in msg)) {
          const pending = this.pendingRequests.get(msg.id);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(msg.id);
            if ("error" in msg) {
              pending.reject(new Error(`${msg.error.message} (code: ${msg.error.code})`));
            } else {
              pending.resolve(msg.result);
            }
          }
          return;
        }
        if ("method" in msg && !("id" in msg)) {
          const handler = this.notificationHandlers.get(msg.method);
          if (handler) {
            handler(msg.params);
          }
        }
      }
    };
    exports2.BridgeClient = BridgeClient;
    function getIPCExportCommand(socketPath) {
      return `export VSCODE_IPC_HOOK_CLI="${socketPath}"`;
    }
    function generateAutoInjectScript() {
      return `
# BiDirection: Auto-inject VSCODE_IPC_HOOK_CLI
# Add this to your ~/.zshrc or ~/.bashrc
bidirection_inject() {
  local sock
  sock=$(ls -t \${TMPDIR:-/tmp}/vscode-ipc-*.sock 2>/dev/null | head -1)
  if [ -n "$sock" ] && [ -S "$sock" ]; then
    export VSCODE_IPC_HOOK_CLI="$sock"
  fi
}
bidirection_inject
`.trim();
    }
  }
});

// ../core/dist/antigravity.js
var require_antigravity = __commonJS({
  "../core/dist/antigravity.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2)
            if (Object.prototype.hasOwnProperty.call(o2, k))
              ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule)
          return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++)
            if (k[i] !== "default")
              __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ANTIGRAVITY_PATHS = void 0;
    exports2.listBrainConversations = listBrainConversations;
    exports2.getBrainArtifacts = getBrainArtifacts;
    exports2.readBrainArtifact = readBrainArtifact;
    exports2.getBrainLogs = getBrainLogs;
    exports2.listKnowledgeItems = listKnowledgeItems;
    exports2.readKnowledgeArtifact = readKnowledgeArtifact;
    exports2.searchKnowledge = searchKnowledge;
    exports2.detectCurrentConversation = detectCurrentConversation;
    var path = __importStar(require("path"));
    var os = __importStar(require("os"));
    var fs2 = __importStar(require("fs"));
    var HOME = os.homedir();
    exports2.ANTIGRAVITY_PATHS = {
      /** Root data dir: ~/.gemini/antigravity */
      DATA_DIR: path.join(HOME, ".gemini", "antigravity"),
      /** Brain artifacts: ~/.gemini/antigravity/brain */
      BRAIN_DIR: path.join(HOME, ".gemini", "antigravity", "brain"),
      /** Knowledge items: ~/.gemini/antigravity/knowledge */
      KNOWLEDGE_DIR: path.join(HOME, ".gemini", "antigravity", "knowledge"),
      /** Conversation protobuf files: ~/.gemini/antigravity/conversations */
      CONVERSATIONS_DIR: path.join(HOME, ".gemini", "antigravity", "conversations"),
      /** App support: ~/Library/Application Support/Antigravity */
      APP_SUPPORT: path.join(HOME, "Library", "Application Support", "Antigravity"),
      /** User extensions: ~/.antigravity/extensions */
      EXTENSIONS_DIR: path.join(HOME, ".antigravity", "extensions"),
      /** Playground projects */
      PLAYGROUND_DIR: path.join(HOME, ".gemini", "antigravity", "playground"),
      /** Browser recordings */
      RECORDINGS_DIR: path.join(HOME, ".gemini", "antigravity", "browser_recordings")
    };
    function listBrainConversations() {
      const brainDir = exports2.ANTIGRAVITY_PATHS.BRAIN_DIR;
      if (!fs2.existsSync(brainDir))
        return [];
      const entries = fs2.readdirSync(brainDir, { withFileTypes: true });
      const conversations = [];
      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        if (!/^[0-9a-f]{8}-/.test(entry.name))
          continue;
        const convPath = path.join(brainDir, entry.name);
        const files = fs2.readdirSync(convPath).filter((f) => !f.startsWith("."));
        const mdFiles = files.filter((f) => f.endsWith(".md") && !f.includes(".resolved") && !f.includes(".metadata"));
        let modifiedAt = /* @__PURE__ */ new Date(0);
        try {
          const stat = fs2.statSync(convPath);
          modifiedAt = stat.mtime;
        } catch {
        }
        conversations.push({
          id: entry.name,
          path: convPath,
          artifacts: mdFiles,
          hasTask: mdFiles.includes("task.md"),
          hasPlan: mdFiles.includes("implementation_plan.md"),
          hasWalkthrough: mdFiles.includes("walkthrough.md"),
          modifiedAt
        });
      }
      conversations.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
      return conversations;
    }
    function getBrainArtifacts(conversationId) {
      const convPath = path.join(exports2.ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId);
      if (!fs2.existsSync(convPath))
        return [];
      const files = fs2.readdirSync(convPath);
      const artifacts = [];
      const mdFiles = files.filter((f) => f.endsWith(".md") && !f.includes(".resolved") && !f.includes(".metadata"));
      for (const mdFile of mdFiles) {
        const fullPath = path.join(convPath, mdFile);
        const stat = fs2.statSync(fullPath);
        const resolvedFiles = files.filter((f) => f.startsWith(mdFile + ".resolved"));
        const versions = resolvedFiles.length;
        let metadata;
        const metaPath = path.join(convPath, mdFile + ".metadata.json");
        if (fs2.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs2.readFileSync(metaPath, "utf-8"));
          } catch {
          }
        }
        artifacts.push({
          name: mdFile,
          path: fullPath,
          size: stat.size,
          modifiedAt: stat.mtime,
          metadata,
          versions
        });
      }
      return artifacts;
    }
    function readBrainArtifact(conversationId, artifactName) {
      const filePath = path.join(exports2.ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId, artifactName);
      if (!fs2.existsSync(filePath))
        return null;
      return fs2.readFileSync(filePath, "utf-8");
    }
    function getBrainLogs(conversationId) {
      const logsDir = path.join(exports2.ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId, ".system_generated", "logs");
      if (!fs2.existsSync(logsDir))
        return [];
      const files = fs2.readdirSync(logsDir).filter((f) => f.endsWith(".txt"));
      return files.map((f) => ({
        name: f.replace(".txt", ""),
        path: path.join(logsDir, f),
        content: fs2.readFileSync(path.join(logsDir, f), "utf-8")
      }));
    }
    function listKnowledgeItems() {
      const knowledgeDir = exports2.ANTIGRAVITY_PATHS.KNOWLEDGE_DIR;
      if (!fs2.existsSync(knowledgeDir))
        return [];
      const entries = fs2.readdirSync(knowledgeDir, { withFileTypes: true });
      const items = [];
      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        const itemPath = path.join(knowledgeDir, entry.name);
        let metadata;
        let summary;
        let lastAccessed;
        const metaPath = path.join(itemPath, "metadata.json");
        if (fs2.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs2.readFileSync(metaPath, "utf-8"));
            summary = metadata?.summary;
            lastAccessed = metadata?.lastAccessed;
          } catch {
          }
        }
        const artifactsDir = path.join(itemPath, "artifacts");
        let artifactPaths = [];
        if (fs2.existsSync(artifactsDir)) {
          artifactPaths = findAllFiles(artifactsDir);
        }
        items.push({
          id: entry.name,
          path: itemPath,
          summary,
          lastAccessed,
          artifactPaths,
          metadata
        });
      }
      return items;
    }
    function readKnowledgeArtifact(knowledgeId, artifactPath) {
      const fullPath = path.join(exports2.ANTIGRAVITY_PATHS.KNOWLEDGE_DIR, knowledgeId, "artifacts", artifactPath);
      if (!fs2.existsSync(fullPath))
        return null;
      return fs2.readFileSync(fullPath, "utf-8");
    }
    function searchKnowledge(query) {
      const results = [];
      const items = listKnowledgeItems();
      const queryLower = query.toLowerCase();
      for (const item of items) {
        if (item.summary?.toLowerCase().includes(queryLower)) {
          results.push({
            knowledgeId: item.id,
            file: "metadata.json",
            line: 0,
            content: item.summary
          });
        }
        for (const artPath of item.artifactPaths) {
          const fullPath = path.join(item.path, "artifacts", artPath);
          try {
            const content = fs2.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(queryLower)) {
                results.push({
                  knowledgeId: item.id,
                  file: artPath,
                  line: i + 1,
                  content: lines[i].trim()
                });
              }
            }
          } catch {
          }
        }
      }
      return results.slice(0, 50);
    }
    function findAllFiles(dir, basePath = "") {
      const results = [];
      const entries = fs2.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const relPath = basePath ? path.join(basePath, entry.name) : entry.name;
        if (entry.isDirectory()) {
          results.push(...findAllFiles(path.join(dir, entry.name), relPath));
        } else {
          results.push(relPath);
        }
      }
      return results;
    }
    function detectCurrentConversation() {
      const conversations = listBrainConversations();
      if (conversations.length === 0)
        return null;
      return conversations[0].id;
    }
  }
});

// ../core/dist/workflows.js
var require_workflows = __commonJS({
  "../core/dist/workflows.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2)
            if (Object.prototype.hasOwnProperty.call(o2, k))
              ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule)
          return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++)
            if (k[i] !== "default")
              __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.listWorkflows = listWorkflows;
    exports2.getWorkflow = getWorkflow;
    exports2.getOrCreateWorkflowDir = getOrCreateWorkflowDir;
    exports2.listSkills = listSkills;
    exports2.getSkill = getSkill;
    var fs2 = __importStar(require("fs"));
    var path = __importStar(require("path"));
    var AGENT_DIRS = [".agents", ".agent", "_agents", "_agent"];
    function findAgentDir(projectRoot) {
      for (const dir of AGENT_DIRS) {
        const full = path.join(projectRoot, dir);
        if (fs2.existsSync(full) && fs2.statSync(full).isDirectory()) {
          return full;
        }
      }
      return null;
    }
    function findWorkflowDirs(projectRoot) {
      const dirs = [];
      for (const dir of AGENT_DIRS) {
        const wfDir = path.join(projectRoot, dir, "workflows");
        if (fs2.existsSync(wfDir) && fs2.statSync(wfDir).isDirectory()) {
          dirs.push(wfDir);
        }
      }
      return dirs;
    }
    function parseFrontmatter(content) {
      const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      if (!match)
        return { description: "", body: content };
      const frontmatter = match[1];
      const body = match[2];
      const descMatch = frontmatter.match(/description:\s*(.+)/);
      const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, "") : "";
      return { description, body };
    }
    function listWorkflows(projectRoot) {
      const wfDirs = findWorkflowDirs(projectRoot);
      const workflows = [];
      for (const wfDir of wfDirs) {
        const files = fs2.readdirSync(wfDir).filter((f) => f.endsWith(".md"));
        for (const file of files) {
          const filePath = path.join(wfDir, file);
          const raw = fs2.readFileSync(filePath, "utf-8");
          const { description, body } = parseFrontmatter(raw);
          const slug = file.replace(/\.md$/, "");
          workflows.push({
            name: file,
            slug,
            path: filePath,
            description,
            content: body,
            hasTurboAll: raw.includes("// turbo-all")
          });
        }
      }
      return workflows;
    }
    function getWorkflow(projectRoot, nameOrSlug) {
      const workflows = listWorkflows(projectRoot);
      return workflows.find((w) => w.slug === nameOrSlug || w.name === nameOrSlug || w.slug.includes(nameOrSlug)) || null;
    }
    function getOrCreateWorkflowDir(projectRoot) {
      const existing = findWorkflowDirs(projectRoot);
      if (existing.length > 0)
        return existing[0];
      const agentDir = findAgentDir(projectRoot);
      const wfDir = agentDir ? path.join(agentDir, "workflows") : path.join(projectRoot, ".agents", "workflows");
      fs2.mkdirSync(wfDir, { recursive: true });
      return wfDir;
    }
    function findSkillDirs(projectRoot) {
      const dirs = [];
      for (const dir of AGENT_DIRS) {
        const skillDir = path.join(projectRoot, dir, "skills");
        if (fs2.existsSync(skillDir) && fs2.statSync(skillDir).isDirectory()) {
          dirs.push(skillDir);
        }
      }
      return dirs;
    }
    function listSkills(projectRoot) {
      const skillDirs = findSkillDirs(projectRoot);
      const skills = [];
      for (const skillDir of skillDirs) {
        const entries = fs2.readdirSync(skillDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory())
            continue;
          const skillPath = path.join(skillDir, entry.name);
          const skillMd = path.join(skillPath, "SKILL.md");
          if (!fs2.existsSync(skillMd))
            continue;
          const raw = fs2.readFileSync(skillMd, "utf-8");
          const { description, body } = parseFrontmatter(raw);
          skills.push({
            name: entry.name,
            path: skillPath,
            description,
            content: body,
            hasScripts: fs2.existsSync(path.join(skillPath, "scripts")),
            hasExamples: fs2.existsSync(path.join(skillPath, "examples"))
          });
        }
      }
      return skills;
    }
    function getSkill(projectRoot, name) {
      const skills = listSkills(projectRoot);
      return skills.find((s) => s.name === name || s.name.includes(name)) || null;
    }
  }
});

// ../core/dist/index.js
var require_dist = __commonJS({
  "../core/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_protocol(), exports2);
    __exportStar(require_socket_utils(), exports2);
    __exportStar(require_antigravity(), exports2);
    __exportStar(require_workflows(), exports2);
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));

// src/server.ts
var net = __toESM(require("net"));
var fs = __toESM(require("fs"));
var import_core = __toESM(require_dist());
var BridgeServer = class {
  constructor(socketPath, onLog = console.log) {
    this.server = null;
    this.clients = /* @__PURE__ */ new Map();
    this.handlers = /* @__PURE__ */ new Map();
    this.nextClientId = 1;
    this.socketPath = socketPath || import_core.BRIDGE_SOCKET_PATH;
    this.onLog = onLog;
  }
  /** Register a handler for a JSON-RPC method */
  registerHandler(method, handler) {
    this.handlers.set(method, handler);
  }
  /** Start the Unix Socket server */
  async start() {
    if (!fs.existsSync(import_core.BRIDGE_DIR)) {
      fs.mkdirSync(import_core.BRIDGE_DIR, { recursive: true, mode: 448 });
    }
    if (fs.existsSync(this.socketPath)) {
      try {
        fs.unlinkSync(this.socketPath);
      } catch {
        throw new Error(`Cannot remove stale socket: ${this.socketPath}`);
      }
    }
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => this.handleConnection(socket));
      this.server.on("error", (err) => {
        this.onLog(`[BiDirection] Server error: ${err.message}`);
        reject(err);
      });
      this.server.listen(this.socketPath, () => {
        try {
          fs.chmodSync(this.socketPath, 384);
        } catch {
        }
        this.writeBridgeInfo();
        this.onLog(`[BiDirection] Bridge server started at ${this.socketPath}`);
        resolve();
      });
    });
  }
  /** Stop the server and disconnect all clients */
  stop() {
    for (const [, client] of this.clients) {
      client.socket.destroy();
    }
    this.clients.clear();
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    try {
      if (fs.existsSync(this.socketPath)) {
        fs.unlinkSync(this.socketPath);
      }
      if (fs.existsSync(import_core.BRIDGE_INFO_PATH)) {
        fs.unlinkSync(import_core.BRIDGE_INFO_PATH);
      }
    } catch {
    }
    this.onLog("[BiDirection] Bridge server stopped");
  }
  /** Send a notification to all connected clients */
  broadcast(method, params) {
    const notification = (0, import_core.createNotification)(method, params);
    const frame = (0, import_core.frameMessage)(notification);
    for (const [, client] of this.clients) {
      try {
        client.socket.write(frame);
      } catch {
      }
    }
  }
  /** Get number of connected clients */
  getClientCount() {
    return this.clients.size;
  }
  /** Get the socket path */
  getSocketPath() {
    return this.socketPath;
  }
  handleConnection(socket) {
    const clientId = this.nextClientId++;
    const reader = new import_core.MessageReader(
      (msg) => this.handleMessage(clientId, msg),
      (err) => this.onLog(`[BiDirection] Client ${clientId} parse error: ${err.message}`)
    );
    const client = {
      id: clientId,
      socket,
      reader,
      subscribedNotifications: /* @__PURE__ */ new Set()
    };
    this.clients.set(clientId, client);
    this.onLog(`[BiDirection] Client ${clientId} connected (total: ${this.clients.size})`);
    socket.on("data", (data) => reader.feed(data));
    socket.on("close", () => {
      this.clients.delete(clientId);
      this.onLog(`[BiDirection] Client ${clientId} disconnected (total: ${this.clients.size})`);
    });
    socket.on("error", (err) => {
      this.onLog(`[BiDirection] Client ${clientId} error: ${err.message}`);
      this.clients.delete(clientId);
    });
  }
  async handleMessage(clientId, msg) {
    const client = this.clients.get(clientId);
    if (!client)
      return;
    if ((0, import_core.isRequest)(msg)) {
      await this.handleRequest(client, msg);
    } else if ((0, import_core.isNotification)(msg)) {
      this.onLog(`[BiDirection] Notification from client ${clientId}: ${msg.method}`);
    }
  }
  async handleRequest(client, request) {
    const startTime = Date.now();
    let response;
    if (request.method === "ping") {
      response = (0, import_core.createSuccessResponse)(request.id, {
        pong: true,
        timestamp: Date.now(),
        version: import_core.BRIDGE_VERSION
      });
    } else {
      const handler = this.handlers.get(request.method);
      if (!handler) {
        response = (0, import_core.createErrorResponse)(
          request.id,
          import_core.ErrorCodes.METHOD_NOT_FOUND,
          `Method not found: ${request.method}`
        );
      } else {
        try {
          const result = await handler(request.params);
          response = (0, import_core.createSuccessResponse)(request.id, result);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          response = (0, import_core.createErrorResponse)(
            request.id,
            import_core.ErrorCodes.INTERNAL_ERROR,
            error.message
          );
        }
      }
    }
    const elapsed = Date.now() - startTime;
    this.onLog(`[BiDirection] ${request.method} \u2192 ${elapsed}ms`);
    try {
      client.socket.write((0, import_core.frameMessage)(response));
    } catch {
      this.onLog(`[BiDirection] Failed to send response to client ${client.id}`);
    }
  }
  writeBridgeInfo() {
    const info = {
      socketPath: this.socketPath,
      version: import_core.BRIDGE_VERSION,
      pid: process.pid,
      startedAt: Date.now()
    };
    try {
      fs.writeFileSync(import_core.BRIDGE_INFO_PATH, JSON.stringify(info, null, 2), {
        mode: 384
      });
    } catch {
      this.onLog("[BiDirection] Warning: Could not write bridge.info");
    }
  }
};

// src/handlers/editor.ts
var vscode = __toESM(require("vscode"));
var import_core2 = __toESM(require_dist());
var highlightDecoration = null;
function getHighlightDecoration(color) {
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
  highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: color || "rgba(255, 255, 0, 0.3)",
    isWholeLine: true,
    overviewRulerColor: color || "rgba(255, 255, 0, 0.7)",
    overviewRulerLane: vscode.OverviewRulerLane.Full
  });
  return highlightDecoration;
}
function requireActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    const err = new Error("No active editor");
    err.code = import_core2.ErrorCodes.NO_ACTIVE_EDITOR;
    throw err;
  }
  return editor;
}
function registerEditorHandlers(server) {
  const disposables = [];
  server.registerHandler(import_core2.Methods.EDITOR_GET_TEXT, async (params) => {
    const p = params || {};
    let doc;
    if (p.uri) {
      doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
    } else {
      const editor = requireActiveEditor();
      doc = editor.document;
    }
    const result = {
      text: doc.getText(),
      uri: doc.uri.fsPath,
      languageId: doc.languageId,
      lineCount: doc.lineCount
    };
    return result;
  });
  server.registerHandler(import_core2.Methods.EDITOR_GET_SELECTION, async (params) => {
    const p = params || {};
    const editor = requireActiveEditor();
    if (p.uri && editor.document.uri.fsPath !== p.uri) {
      throw new Error(`Active editor (${editor.document.uri.fsPath}) doesn't match requested URI (${p.uri})`);
    }
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    const result = {
      text,
      uri: editor.document.uri.fsPath,
      startLine: selection.start.line,
      startCharacter: selection.start.character,
      endLine: selection.end.line,
      endCharacter: selection.end.character
    };
    return result;
  });
  server.registerHandler(import_core2.Methods.EDITOR_SET_CURSOR, async (params) => {
    const p = params;
    let editor;
    if (p.uri) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
      editor = await vscode.window.showTextDocument(doc);
    } else {
      editor = requireActiveEditor();
    }
    const position = new vscode.Position(p.line, p.character);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
    const result = { success: true };
    return result;
  });
  server.registerHandler(import_core2.Methods.EDITOR_APPLY_EDIT, async (params) => {
    const p = params;
    const workspaceEdit = new vscode.WorkspaceEdit();
    const uri = vscode.Uri.file(p.uri);
    for (const edit of p.edits) {
      const range = new vscode.Range(
        new vscode.Position(edit.startLine, edit.startCharacter),
        new vscode.Position(edit.endLine, edit.endCharacter)
      );
      workspaceEdit.replace(uri, range, edit.newText);
    }
    const success = await vscode.workspace.applyEdit(workspaceEdit);
    const result = { success, uri: p.uri };
    return result;
  });
  server.registerHandler(import_core2.Methods.EDITOR_HIGHLIGHT, async (params) => {
    const p = params;
    let editor;
    if (p.uri) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
      editor = await vscode.window.showTextDocument(doc);
    } else {
      editor = requireActiveEditor();
    }
    const decoration = getHighlightDecoration(p.color);
    const range = new vscode.Range(
      new vscode.Position(p.startLine, 0),
      new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER)
    );
    editor.setDecorations(decoration, [range]);
    editor.selection = new vscode.Selection(
      new vscode.Position(p.startLine, 0),
      new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER)
    );
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    const result = { success: true };
    return result;
  });
  disposables.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      server.broadcast(import_core2.Methods.EDITOR_ON_CHANGE, {
        uri: e.document.uri.fsPath,
        changes: e.contentChanges.map((c) => ({
          startLine: c.range.start.line,
          startCharacter: c.range.start.character,
          endLine: c.range.end.line,
          endCharacter: c.range.end.character,
          text: c.text
        }))
      });
    })
  );
  disposables.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      server.broadcast(import_core2.Methods.EDITOR_ON_SAVE, {
        uri: doc.uri.fsPath
      });
    })
  );
  disposables.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        server.broadcast(import_core2.Methods.EDITOR_ON_ACTIVE_CHANGE, {
          uri: editor.document.uri.fsPath,
          languageId: editor.document.languageId
        });
      }
    })
  );
  return disposables;
}
function disposeEditorHandlers() {
  if (highlightDecoration) {
    highlightDecoration.dispose();
    highlightDecoration = null;
  }
}

// src/handlers/workspace.ts
var vscode2 = __toESM(require("vscode"));
var import_core3 = __toESM(require_dist());
var severityMap = {
  [vscode2.DiagnosticSeverity.Error]: "error",
  [vscode2.DiagnosticSeverity.Warning]: "warning",
  [vscode2.DiagnosticSeverity.Information]: "info",
  [vscode2.DiagnosticSeverity.Hint]: "hint"
};
function registerWorkspaceHandlers(server) {
  server.registerHandler(import_core3.Methods.WORKSPACE_OPEN_FILE, async (params) => {
    const p = params;
    const uri = vscode2.Uri.file(p.uri);
    const doc = await vscode2.workspace.openTextDocument(uri);
    const editor = await vscode2.window.showTextDocument(doc, {
      preview: p.preview !== false
    });
    if (p.line !== void 0) {
      const line = p.line;
      const character = p.character || 0;
      const position = new vscode2.Position(line, character);
      editor.selection = new vscode2.Selection(position, position);
      editor.revealRange(
        new vscode2.Range(position, position),
        vscode2.TextEditorRevealType.InCenter
      );
    }
    const result = { success: true, uri: p.uri };
    return result;
  });
  server.registerHandler(import_core3.Methods.WORKSPACE_GET_DIAGNOSTICS, async (params) => {
    const p = params || {};
    const allDiagnostics = vscode2.languages.getDiagnostics();
    const diagnosticItems = [];
    for (const [uri, diagnostics] of allDiagnostics) {
      if (p.uri && uri.fsPath !== p.uri) {
        continue;
      }
      for (const diag of diagnostics) {
        diagnosticItems.push({
          uri: uri.fsPath,
          line: diag.range.start.line,
          character: diag.range.start.character,
          endLine: diag.range.end.line,
          endCharacter: diag.range.end.character,
          message: diag.message,
          severity: severityMap[diag.severity] || "info",
          source: diag.source
        });
      }
    }
    const result = { diagnostics: diagnosticItems };
    return result;
  });
  server.registerHandler(import_core3.Methods.WORKSPACE_GET_OPEN_FILES, async () => {
    const activeUri = vscode2.window.activeTextEditor?.document.uri.fsPath;
    const files = [];
    for (const group of vscode2.window.tabGroups.all) {
      for (const tab of group.tabs) {
        if (tab.input instanceof vscode2.TabInputText) {
          const uri = tab.input.uri.fsPath;
          let isDirty = false;
          let languageId = "unknown";
          try {
            const doc = vscode2.workspace.textDocuments.find(
              (d) => d.uri.fsPath === uri
            );
            if (doc) {
              isDirty = doc.isDirty;
              languageId = doc.languageId;
            }
          } catch {
          }
          files.push({
            uri,
            isActive: uri === activeUri,
            isDirty,
            languageId
          });
        }
      }
    }
    const result = { files };
    return result;
  });
}

// src/handlers/terminal.ts
var vscode3 = __toESM(require("vscode"));
var import_core4 = __toESM(require_dist());
function registerTerminalHandlers(server) {
  server.registerHandler(import_core4.Methods.TERMINAL_SEND_TEXT, async (params) => {
    const p = params;
    let terminal;
    if (p.terminalName) {
      terminal = vscode3.window.terminals.find((t) => t.name === p.terminalName);
      if (!terminal) {
        terminal = vscode3.window.createTerminal(p.terminalName);
      }
    } else {
      terminal = vscode3.window.activeTerminal;
      if (!terminal) {
        terminal = vscode3.window.createTerminal("BiDirection");
      }
    }
    terminal.show();
    terminal.sendText(p.text, p.addNewLine !== false);
    const result = { success: true };
    return result;
  });
}

// src/handlers/window.ts
var vscode4 = __toESM(require("vscode"));
var import_core5 = __toESM(require_dist());
function registerWindowHandlers(server) {
  server.registerHandler(import_core5.Methods.WINDOW_SHOW_MESSAGE, async (params) => {
    const p = params;
    const actions = p.actions || [];
    let selectedAction;
    switch (p.type) {
      case "warning":
        selectedAction = await vscode4.window.showWarningMessage(p.message, ...actions);
        break;
      case "error":
        selectedAction = await vscode4.window.showErrorMessage(p.message, ...actions);
        break;
      default:
        selectedAction = await vscode4.window.showInformationMessage(p.message, ...actions);
    }
    const result = { selectedAction };
    return result;
  });
  server.registerHandler(import_core5.Methods.WINDOW_SHOW_QUICK_PICK, async (params) => {
    const p = params;
    const items = p.items.map((item) => ({
      label: item.label,
      description: item.description,
      detail: item.detail
    }));
    const selected = await vscode4.window.showQuickPick(items, {
      title: p.title,
      placeHolder: p.placeholder
    });
    const result = {
      selectedItem: selected?.label
    };
    return result;
  });
  server.registerHandler(import_core5.Methods.COMMAND_EXECUTE, async (params) => {
    const p = params;
    const cmdResult = await vscode4.commands.executeCommand(p.command, ...p.args || []);
    const result = { result: cmdResult };
    return result;
  });
  server.registerHandler(import_core5.Methods.GET_INFO, async () => {
    const workspaceFolders = vscode4.workspace.workspaceFolders?.map(
      (f) => f.uri.fsPath
    ) || [];
    const result = {
      name: "BiDirection Bridge",
      version: import_core5.BRIDGE_VERSION,
      ide: "vscode",
      ideVersion: vscode4.version,
      socketPath: server.getSocketPath(),
      pid: process.pid,
      workspaceFolders
    };
    return result;
  });
}

// src/extension.ts
var bridgeServer = null;
var statusBarItem;
var outputChannel;
async function activate(context) {
  outputChannel = vscode5.window.createOutputChannel("BiDirection Bridge");
  statusBarItem = vscode5.window.createStatusBarItem(
    vscode5.StatusBarAlignment.Right,
    100
  );
  const log = (msg) => {
    outputChannel.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`);
  };
  context.subscriptions.push(
    vscode5.commands.registerCommand("bidirection.startBridge", () => startBridge(log)),
    vscode5.commands.registerCommand("bidirection.stopBridge", () => stopBridge(log)),
    vscode5.commands.registerCommand("bidirection.showStatus", () => showStatus()),
    statusBarItem,
    outputChannel
  );
  const config = vscode5.workspace.getConfiguration("bidirection");
  if (config.get("autoStart", true)) {
    await startBridge(log);
  }
}
async function startBridge(log) {
  if (bridgeServer) {
    vscode5.window.showInformationMessage("BiDirection Bridge is already running");
    return;
  }
  try {
    const config = vscode5.workspace.getConfiguration("bidirection");
    const customPath = config.get("socketPath", "") || void 0;
    bridgeServer = new BridgeServer(customPath, log);
    const editorDisposables = registerEditorHandlers(bridgeServer);
    registerWorkspaceHandlers(bridgeServer);
    registerTerminalHandlers(bridgeServer);
    registerWindowHandlers(bridgeServer);
    await bridgeServer.start();
    updateStatusBar(true);
    log(`Bridge started successfully at ${bridgeServer.getSocketPath()}`);
    vscode5.window.showInformationMessage(
      `BiDirection Bridge started at ${bridgeServer.getSocketPath()}`
    );
    for (const d of editorDisposables) {
      d.dispose;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    log(`Failed to start bridge: ${error.message}`);
    vscode5.window.showErrorMessage(`BiDirection Bridge failed to start: ${error.message}`);
    bridgeServer = null;
    updateStatusBar(false);
  }
}
function stopBridge(log) {
  if (!bridgeServer) {
    vscode5.window.showInformationMessage("BiDirection Bridge is not running");
    return;
  }
  bridgeServer.stop();
  bridgeServer = null;
  disposeEditorHandlers();
  updateStatusBar(false);
  log("Bridge stopped");
  vscode5.window.showInformationMessage("BiDirection Bridge stopped");
}
function showStatus() {
  if (bridgeServer) {
    const clientCount = bridgeServer.getClientCount();
    vscode5.window.showInformationMessage(
      `BiDirection Bridge: Running at ${bridgeServer.getSocketPath()} | ${clientCount} client(s) connected`
    );
  } else {
    vscode5.window.showInformationMessage("BiDirection Bridge: Not running");
  }
}
function updateStatusBar(running) {
  if (running && bridgeServer) {
    statusBarItem.text = "$(plug) BiDirection";
    statusBarItem.tooltip = `Bridge: ${bridgeServer.getSocketPath()} (${bridgeServer.getClientCount()} clients)`;
    statusBarItem.command = "bidirection.showStatus";
    statusBarItem.show();
  } else {
    statusBarItem.text = "$(debug-disconnect) BiDirection";
    statusBarItem.tooltip = "Bridge not running. Click to start.";
    statusBarItem.command = "bidirection.startBridge";
    statusBarItem.show();
  }
}
function deactivate() {
  if (bridgeServer) {
    bridgeServer.stop();
    bridgeServer = null;
  }
  disposeEditorHandlers();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
