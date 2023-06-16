# artifact-link

run this action after you built your binaries and uploaded them as artifacts.

it will create a list of all the artifacts with a download link,
and comment it under your commit and PR, with continuously updating
links if you push new things to the PR.

under the hood this little script uses [nightly.link](https://nightly.link),
huge thanks to its creator

## basic example

```yaml
on:
  push:
  pull_request:

jobs:
  build:
    steps:
      - ... # run whatever build tool
      - uses: actions/upload-artifact@v3 # upload the results
  link:
    needs: build # make sure the artifacts are uploaded first
    steps:
      - uses: beni69/artifact-link@v1
        with:
          token: ${{ github.token }}
```
