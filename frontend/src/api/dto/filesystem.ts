export interface FileElementDto {
    id: string;
    name: string;
    type: string; // "file", "directory", "project"
    createdOn: string; // ISO 8601 String, because Java Instant
    lastAccess: string; // ISO 8601 String
}

// --- Requests---

// DirectoryRequest.java
export interface DirectoryRequest {
    name: string;
}

// CreateFileRequest.java
export interface CreateFileRequest {
    name: string;
    contentType: string;
}

// ProjectRequest.java
export interface ProjectRequest {
    name: string;
}

// RenameFileRequest.java
export interface RenameFileRequest {
    name: string;
}

// FileContentRequest.java
export interface FileContentRequest {
    content: string; // Base64
    contentType: string;
}

// --- Responses ---

// DirectoryContentsResponse.java
export interface DirectoryContentsResponse extends FileElementDto {
    contents: FileElementDto[];
}

// DirectoryDetailsResponse.java
export type DirectoryDetailsResponse = FileElementDto;

// ProjectContentsResponse.java
export interface ProjectContentsResponse extends FileElementDto {
    contents: FileElementDto[];
}

// UserResponse.java
export interface UserResponse {
    userId: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean | null;
}

// ProjectDetailsResponse.java
export interface ProjectDetailsResponse extends FileElementDto {
    owner: UserResponse | null;
}

// FileDetailsResponse.java
export interface FileDetailsResponse extends FileElementDto {
    contentType: string;
}

// FileContentResponse.java
export interface FileContentResponse {
    content: string; // Byte-Array as Base64 String
}

// --- Helper Types ---

// Union-Type helps to iterate over lists
export type AnyFileElement = DirectoryContentsResponse | FileDetailsResponse | ProjectContentsResponse | FileElementDto;
