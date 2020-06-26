import { execSync, exec } from "child_process";
import { existsSync } from "fs";
import createDebugger from "debug";

function _extends() {
  _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return _extends.apply(this, arguments);
}

var debug = /*#__PURE__*/ createDebugger("gitlog");
var delimiter = "\t";
var fieldMap = {
  hash: "%H",
  abbrevHash: "%h",
  treeHash: "%T",
  abbrevTreeHash: "%t",
  parentHashes: "%P",
  abbrevParentHashes: "%P",
  authorName: "%an",
  authorEmail: "%ae",
  authorDate: "%ai",
  authorDateRel: "%ar",
  committerName: "%cn",
  committerEmail: "%ce",
  committerDate: "%cd",
  committerDateRel: "%cr",
  subject: "%s",
  body: "%b",
  rawBody: "%B",
  tags: "%D",
};
var notOptFields = ["status", "files"];
var defaultFields = [
  "abbrevHash",
  "hash",
  "subject",
  "authorName",
  "authorDate",
];
var defaultOptions = {
  number: 10,
  fields: defaultFields,
  nameStatus: true,
  includeMergeCommitFiles: false,
  findCopiesHarder: false,
  all: false,
};
/** Add optional parameter to command */

function addOptional(command, options) {
  var commandWithOptions = command;
  var cmdOptional = [
    "author",
    "since",
    "after",
    "until",
    "before",
    "committer",
  ];

  for (var i = cmdOptional.length; i--; ) {
    if (options[cmdOptional[i]]) {
      commandWithOptions +=
        " --" + cmdOptional[i] + '="' + options[cmdOptional[i]] + '"';
    }
  }

  return commandWithOptions;
}
/** Parse the output of "git log" for commit information */

var parseCommits = function parseCommits(commits, fields, nameStatus) {
  return commits.map(function (rawCommit) {
    var parts = rawCommit.split("@end@");
    var commit = parts[0].split(delimiter);

    if (parts[1]) {
      var parseNameStatus = parts[1].trimLeft().split("\n"); // Removes last empty char if exists

      if (parseNameStatus[parseNameStatus.length - 1] === "") {
        parseNameStatus.pop();
      } // Split each line into it's own delimited array

      var nameAndStatusDelimited = parseNameStatus.map(function (d) {
        return d.split(delimiter);
      }); // 0 will always be status, last will be the filename as it is in the commit,
      // anything in between could be the old name if renamed or copied

      nameAndStatusDelimited.forEach(function (item) {
        var status = item[0];
        var tempArr = [status, item[item.length - 1]]; // If any files in between loop through them

        for (var i = 1, len = item.length - 1; i < len; i++) {
          // If status R then add the old filename as a deleted file + status
          // Other potentials are C for copied but this wouldn't require the original deleting
          if (status.slice(0, 1) === "R") {
            tempArr.push("D", item[i]);
          }
        }

        commit.push.apply(commit, tempArr);
      });
    }

    debug("commit", commit); // Remove the first empty char from the array

    commit.shift();
    var parsed = {};

    if (nameStatus) {
      // Create arrays for non optional fields if turned on
      notOptFields.forEach(function (d) {
        parsed[d] = [];
      });
    }

    commit.forEach(function (commitField, index) {
      if (fields[index]) {
        if (fields[index] === "tags") {
          var tags = [];
          var start = commitField.indexOf("tag: ");

          if (start >= 0) {
            commitField
              .substr(start + 5)
              .trim()
              .split(",")
              .forEach(function (tag) {
                tags.push(tag.trim());
              });
          }

          parsed[fields[index]] = tags;
        } else {
          parsed[fields[index]] = commitField;
        }
      } else if (nameStatus) {
        var pos = (index - fields.length) % notOptFields.length;
        debug(
          "nameStatus",
          index - fields.length,
          notOptFields.length,
          pos,
          commitField
        );
        var arr = parsed[notOptFields[pos]];

        if (Array.isArray(arr)) {
          arr.push(commitField);
        }
      }
    });
    return parsed;
  });
};
/** Run "git log" and return the result as JSON */

function createCommand(options) {
  // Start constructing command
  var command = "git log ";

  if (options.findCopiesHarder) {
    command += "--find-copies-harder ";
  }

  if (options.all) {
    command += "--all ";
  }

  if (options.includeMergeCommitFiles) {
    command += "-m ";
  }

  command += "-n " + options.number;
  command = addOptional(command, options); // Start of custom format

  command += ' --pretty="@begin@'; // Iterating through the fields and adding them to the custom format

  if (options.fields) {
    options.fields.forEach(function (field) {
      if (!fieldMap[field] && !notOptFields.includes(field)) {
        throw new Error("Unknown field: " + field);
      }

      command += delimiter + fieldMap[field];
    });
  } // Close custom format

  command += '@end@"'; // Append branch (revision range) if specified

  if (options.branch) {
    command += " " + options.branch;
  } // File and file status

  if (options.nameStatus) {
    command += " --name-status";
  }

  if (options.file) {
    command += " -- " + options.file;
  }

  debug("command", options.execOptions, command);
  return command;
}

function gitlog(userOptions, cb) {
  if (!userOptions.repo) {
    throw new Error("Repo required!");
  }

  if (!existsSync(userOptions.repo)) {
    throw new Error("Repo location does not exist");
  } // Set defaults

  var options = _extends({}, defaultOptions, {}, userOptions);

  var execOptions = _extends(
    {
      cwd: userOptions.repo,
    },
    userOptions.execOptions
  );

  var command = createCommand(options);

  if (!cb) {
    var stdout = execSync(command, execOptions).toString();
    var commits = stdout.split("@begin@");

    if (commits[0] === "") {
      commits.shift();
    }

    debug("commits", commits);
    return parseCommits(commits, options.fields, options.nameStatus);
  }

  exec(command, execOptions, function (err, stdout, stderr) {
    debug("stdout", stdout);
    var commits = stdout.split("@begin@");

    if (commits[0] === "") {
      commits.shift();
    }

    debug("commits", commits);
    cb(
      stderr || err,
      parseCommits(commits, options.fields, options.nameStatus)
    );
  });
}

function gitlogPromise(options) {
  return new Promise(function (resolve, reject) {
    gitlog(options, function (err, commits) {
      if (err) {
        reject(err);
      } else {
        resolve(commits);
      }
    });
  });
}

export default gitlog;
export { gitlogPromise };
//# sourceMappingURL=gitlog.esm.js.map
