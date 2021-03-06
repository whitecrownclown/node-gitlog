/// <reference types="node" />
import { ExecSyncOptions, ExecException } from "child_process";
declare const fieldMap: {
  readonly hash: "%H";
  readonly abbrevHash: "%h";
  readonly treeHash: "%T";
  readonly abbrevTreeHash: "%t";
  readonly parentHashes: "%P";
  readonly abbrevParentHashes: "%P";
  readonly authorName: "%an";
  readonly authorEmail: "%ae";
  readonly authorDate: "%ai";
  readonly authorDateRel: "%ar";
  readonly committerName: "%cn";
  readonly committerEmail: "%ce";
  readonly committerDate: "%cd";
  readonly committerDateRel: "%cr";
  readonly subject: "%s";
  readonly body: "%b";
  readonly rawBody: "%B";
  readonly tags: "%D";
};
export declare type CommitField = keyof typeof fieldMap;
declare const defaultFields: readonly [
  "abbrevHash",
  "hash",
  "subject",
  "authorName",
  "authorDate"
];
declare type DefaultField = typeof defaultFields[number];
export interface GitlogOptions<Fields extends string = DefaultField> {
  /** The location of the repo */
  repo: string;
  /**
   * Much more likely to set status codes to 'C' if files are exact copies of each other.
   *
   * @default false
   */
  findCopiesHarder?: boolean;
  /**
   * Find commits on all branches instead of just on the current one.
   *
   * @default false
   */
  all?: boolean;
  /**
   * Pass the -m option to includes files in a merge commit
   *
   * @default false
   */
  includeMergeCommitFiles?: boolean;
  /**
   * The number of commits to return
   *
   * @default 10
   */
  number?: number;
  /** An array of fields to return from the log */
  fields?: readonly Fields[];
  /**
   * Below fields was returned from the log:
   *
   * - files - changed files names (array)
   * - status - changed files status (array)
   *
   * @default true
   */
  nameStatus?: boolean;
  /**
   * Show only commits in the specified branch or revision range.
   * By default uses the current branch and defaults to HEAD (i.e.
   * the whole history leading to the current commit).
   */
  branch?: string;
  /** File filter for the git log command */
  file?: string;
  /** Limit the commits output to ones with author header lines that match the specified pattern. */
  author?: string;
  /** Limit the commits output to ones with committer header lines that match the specified pattern. */
  committer?: string;
  /** Show commits more recent than a specific date. */
  since?: string;
  /** Show commits more recent than a specific date. */
  after?: string;
  /** Show commits older than a specific date */
  until?: string;
  /** Show commits older than a specific date */
  before?: string;
  /** Specify some options to be passed to the .exec() method */
  execOptions?: ExecSyncOptions;
}
declare type GitlogError = ExecException | string | null;
declare type CommitBase<Field extends string> = Record<Field, string>;
declare type CommitBaseWithFiles<Field extends string> = Record<
  Field | "status",
  string
> & {
  files: string[];
};
declare function gitlog<Field extends CommitField = DefaultField>(
  userOptions: GitlogOptions<Field> & {
    nameStatus: false;
  },
  cb: (err: GitlogError, commits: CommitBase<Field>[]) => void
): void;
declare function gitlog<Field extends CommitField = DefaultField>(
  userOptions: GitlogOptions<Field>,
  cb: (err: GitlogError, commits: CommitBaseWithFiles<Field>[]) => void
): void;
declare function gitlog<Field extends CommitField = DefaultField>(
  userOptions: GitlogOptions<Field> & {
    nameStatus: false;
  }
): CommitBase<Field>[];
declare function gitlog<Field extends CommitField = DefaultField>(
  userOptions: GitlogOptions<Field>
): CommitBaseWithFiles<Field>[];
export declare function gitlogPromise<Field extends CommitField = DefaultField>(
  options: GitlogOptions<Field> & {
    nameStatus: false;
  }
): Promise<CommitBase<Field>[]>;
export declare function gitlogPromise<Field extends CommitField = DefaultField>(
  options: GitlogOptions<Field>
): Promise<CommitBaseWithFiles<Field>[]>;
export default gitlog;
