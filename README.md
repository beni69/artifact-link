# artifact-link

run this action after you built your binaries and uploaded them as artifacts.

it will create a list of all the artifacts with a download link,
and comment it under your commit and PR, with continuously updating
links if you push new things to the PR.

under the hood this little script uses [nightly.link](https://nightly.link),
huge thanks to its creator

## examples

### basic usage

```yaml
on:
  push:
  pull_request:

jobs:
  build:
    steps:
      - ... # run whatever build tool
      - uses: actions/upload-artifact@v4 # upload the results
  link:
    needs: build # make sure the artifacts are uploaded first
    permissions:
        contents: write # for commenting on your commit
        pull-requests: write # for commenting on your pr
    steps:
      - uses: beni69/artifact-link@v1
        with:
          token: ${{ github.token }}
```

### disable summary

```yaml
- uses: beni69/artifact-link@v1
  with:
    summary: false # do not post links as gh workflow summary
```

### table generation

by default the output generates a markdown list but we can make it a table.
just give a regex to use to determine the column and row using named capture groups.

in this example, let's suppose we've got a build matrix and we're naming our artifacts
thing-{os}-{arch}

these would be easier to read as a table

```yaml
- uses: beni69/artifact-link@v1
  with:
    group: 'thing-(?<row>.+)-(?<col>.+)$'
```

the result:

| <!-- empty --> | amd64                                               | arm64                                               | arm32                                               |
| -------------- | --------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| windows        | [Download](https://example.com/thing-windows-amd64) | [Download](https://example.com/thing-windows-arm64) | [Download](https://example.com/thing-windows-arm32) |
| linux          | [Download](https://example.com/thing-linux-amd64)   | [Download](https://example.com/thing-linux-arm64)   | [Download](https://example.com/thing-linux-arm32)   |
| macos          | [Download](https://example.com/thing-macos-amd64)   | [Download](https://example.com/thing-macos-arm64)   | [Download](https://example.com/thing-macos-arm32)   |
