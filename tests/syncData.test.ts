import nock from "nock";
import {afterAll, afterEach, beforeAll, describe, expect, it} from "vitest";
import {getRestClient, RestClient} from "./restClient.js";
import {createTestApp, TestApp} from "./testApp.js";
import {createTestAccount} from "./mocks/testAccount.js";
import {SynchronizerType} from "../src/types/types.synchronizerConfig.js";
import {fileBuilder, folderBuilder, googleDocBuilder, resetFileCounter} from "./mocks/fileBuilder.js";
import {driveBuilder, resetDriveCounter} from "./mocks/driveBuilder.js";
import {resetUserCounter, userBuilder} from "./mocks/userBuilder.js";

describe("POST /api/v1/synchronizer/data", () => {
  let app: TestApp;
  let restClient: RestClient;
  const account = createTestAccount();

  const googleApi = () => nock("https://www.googleapis.com");

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  afterEach(() => {
    resetFileCounter();
    resetDriveCounter();
    resetUserCounter();
    nock.cleanAll();
  });

  describe("drives", () => {
    it("should retrieve My Drive and shared drives", async () => {
      const sharedDrive = driveBuilder();

      // Mock My Drive root
      googleApi().get("/drive/v3/files/root").query(true).reply(200, {id: "root_id", name: "My Drive"});

      // Mock shared drives list
      googleApi().get("/drive/v3/drives").query(true).reply(200, {drives: [sharedDrive]});

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Drive,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.items[0]).toMatchObject({
        id: "root",
        name: "My Drive",
        type: "Personal",
      });
      expect(res.body.items[1]).toMatchObject({
        id: "shared_with_me",
        name: "Shared with me",
        type: "Shared With Me",
      });
      expect(res.body.items[2]).toMatchObject({
        id: sharedDrive.id,
        name: sharedDrive.name,
        type: "Shared",
      });
      expect(res.body.synchronizationType).toEqual("full");
    });
  });

  describe("folders", () => {
    it("should retrieve folders", async () => {
      const folder1 = folderBuilder({name: "Documents"});
      const folder2 = folderBuilder({name: "Images", parents: [folder1.id]});

      googleApi()
        .get("/drive/v3/files")
        .query(true)
        .reply(200, {files: [folder1, folder2]});

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Folder,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toMatchObject({
        id: folder1.id,
        name: "Documents",
      });
      expect(res.body.items[1]).toMatchObject({
        id: folder2.id,
        name: "Images",
        parentId: folder1.id,
      });
    });

    it("should support delta sync with lastSynchronizedAt", async () => {
      const folder = folderBuilder();
      const lastSynchronizedAt = "2024-01-01T00:00:00.000Z";

      googleApi()
        .get("/drive/v3/files")
        .query((q) => q.q?.includes("modifiedTime >") || false)
        .reply(200, {files: [folder]});

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Folder,
        lastSynchronizedAt,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.synchronizationType).toEqual("delta");
    });
  });

  describe("files", () => {
    it("should retrieve files with metadata", async () => {
      const file = fileBuilder({name: "report.pdf", mimeType: "application/pdf"});

      googleApi().get("/drive/v3/files").query(true).reply(200, {files: [file]});

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.File,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        id: file.id,
        name: "report.pdf",
        mimeType: "application/pdf",
        mimeTypeCategory: "PDF",
      });
    });

    it("should extract content from Google Docs", async () => {
      const doc = googleDocBuilder({name: "My Document"});
      const docContent = "This is the document content";

      // Mock files list
      googleApi().get("/drive/v3/files").query(true).reply(200, {files: [doc]});

      // Mock content export
      googleApi().get(`/drive/v3/files/${doc.id}/export`).query(true).reply(200, docContent);

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.File,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items[0]).toMatchObject({
        id: doc.id,
        mimeTypeCategory: "Document",
        content: docContent,
      });
    });

    it("should handle pagination", async () => {
      const file1 = fileBuilder({name: "file1.txt"});
      const nextPageToken = "next_page_token";

      googleApi().get("/drive/v3/files").query(true).reply(200, {
        files: [file1],
        nextPageToken,
      });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.File,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.pagination).toMatchObject({
        hasNext: true,
        nextPageConfig: {pageToken: nextPageToken},
      });
    });
  });

  describe("users", () => {
    it("should collect users from file owners and current user", async () => {
      const currentUser = userBuilder({me: true, emailAddress: "current@example.com"});
      const fileOwner = userBuilder({emailAddress: "owner@example.com"});
      const file = fileBuilder({
        owners: [fileOwner],
      });

      // Mock about (current user)
      googleApi().get("/drive/v3/about").query(true).reply(200, {user: currentUser});

      // Mock files list
      googleApi().get("/drive/v3/files").query(true).reply(200, {files: [file]});

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.User,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((u) => (u as {email: string}).email)).toContain("current@example.com");
      expect(res.body.items.map((u) => (u as {email: string}).email)).toContain("owner@example.com");
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});

describe("GET /", () => {
  let app: TestApp;
  let restClient: RestClient;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it("should return connector config with OAuth2 authentication", async () => {
    const res = await restClient.getConnectorConfig();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toMatchObject({
      id: "google-drive-connector",
      name: "Google Drive",
      authentication: [
        {
          id: "oauth2",
          name: "Google Account",
          type: "oauth2",
        },
      ],
      responsibleFor: {
        dataSynchronization: true,
      },
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});

describe("POST /api/v1/synchronizer/config", () => {
  let app: TestApp;
  let restClient: RestClient;
  const account = createTestAccount();

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it("should return sync config with 4 entity types", async () => {
    const res = await restClient.getSyncConfig(account);

    expect(res.statusCode).toEqual(200);
    expect(res.body.types).toHaveLength(4);
    expect(res.body.types.map((t) => t.id)).toEqual(["drive", "folder", "file", "user"]);
    expect(res.body.filters).toHaveLength(1);
    expect(res.body.filters[0]).toMatchObject({
      id: "driveIds",
      title: "Drives to Sync",
      datalist: true,
      type: "multidropdown",
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});

describe("POST /api/v1/synchronizer/schema", () => {
  let app: TestApp;
  let restClient: RestClient;
  const account = createTestAccount();

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it("should return schema with relations for all entity types", async () => {
    const res = await restClient.getSyncSchema({
      types: ["drive", "folder", "file", "user"],
      account,
    });

    expect(res.statusCode).toEqual(200);

    // Check Drive schema
    expect(res.body.drive).toBeDefined();
    expect(res.body.drive.id).toMatchObject({name: "Id", type: "id"});
    expect(res.body.drive.name).toMatchObject({name: "Name", type: "text"});

    // Check Folder schema with relations
    expect(res.body.folder).toBeDefined();
    expect(res.body.folder.parentId.relation).toMatchObject({
      cardinality: "many-to-one",
      name: "Parent Folder",
      targetType: "folder",
    });
    expect(res.body.folder.driveId.relation).toMatchObject({
      cardinality: "many-to-one",
      name: "Drive",
      targetType: "drive",
    });

    // Check File schema with relations
    expect(res.body.file).toBeDefined();
    expect(res.body.file.ownerId.relation).toMatchObject({
      cardinality: "many-to-one",
      name: "Owner",
      targetType: "user",
    });
    expect(res.body.file.content).toMatchObject({name: "Content", type: "text", subType: "md"});

    // Check User schema
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toMatchObject({name: "Email", type: "text", subType: "email"});
  });

  afterAll(async () => {
    await app.destroy();
  });
});
