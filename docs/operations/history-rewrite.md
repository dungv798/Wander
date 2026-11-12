# Rewriting git history to drop heavy binaries (prepared, not pushed)

The repository history carries about 250 MB of original catalog JPG/PNG files plus images and video from folders that were later
removed (`docs/research`, `docs/UI-sample`, `.taste-skill`, …). They are not needed by any checked-out tree, but they make every clone
slow. `tools/rewrite-history.sh` removes them from **every commit** in a *separate* clone; nothing in this repository or on GitHub is
changed until you decide to force-push (below). Measured sizes are in `docs/upgrade-report.md`.

What the rewrite does and does not change:

- Removes `*.jpg|jpeg|png` under `backend/src/main/resources/catalog/photos/` (the optimized `*.webp` files stay) and every image, video,
  audio, pdf, archive or font that ever lived under the folders listed in the script. Text files are untouched.
- The tree at the tip of the rewritten branch is **byte-identical** to the original tip (the script prints its tree hash; compare it with
  `git rev-parse portfolio-upgrade^{tree}` in the original). So everything verified on the original tip holds for the rewritten one.
- Every commit gets a new hash (tags too). Old commit links, open PRs and any other clone stop matching.
- **`main` stops being runnable.** Its old tip needs the original JPGs, which are now gone from history. Only `portfolio-upgrade`
  (WebP photos) is a working application. That is why the recommended push below makes `portfolio-upgrade` the new `main`.

> Status at the end of the portfolio upgrade (12/11/2026): the final preparation is in `D:\wander-backup-20261112-rewritten-final`
> (made from the mirror `D:\wander-backup-20261112-final.git`; 132 commits; tip tree identical to `portfolio-upgrade` at commit `be723dd` (later commits only edit these notes), tree hash
> `258e8f3…`; `.git` 465,062,965 -> 181,818,357 bytes). `D:\Wander-rewritten` is an older preparation and can be deleted. Use the
> directory above wherever the commands below say `D:\Wander-rewritten`. Not pushed.

## Preparing it again (any time)

```bash
git clone --mirror https://github.com/dungv798/Wander.git /d/wander-backup-$(date +%Y%m%d).git      # rollback copy, keep it
tools/rewrite-history.sh /d/wander-backup-YYYYMMDD.git /d/Wander-rewritten portfolio-upgrade
```

## Publishing it (your decision; this overwrites the remote history)

Do this only after you have a backup and have checked `D:\Wander-rewritten` (run `make verify` or `tools/dev.ps1 verify` there).

```bash
cd /d/Wander-rewritten
git remote add origin https://github.com/dungv798/Wander.git     # filter-repo removed it on purpose

# Recommended: the rewritten portfolio-upgrade becomes the new main (old main cannot run any more).
git push --force origin portfolio-upgrade:main
git push --force origin portfolio-upgrade phase-0-baseline
git push --force origin --tags

# Alternative (keeps the old rewritten main, which will not start): git push --force --all origin && git push --force --tags origin
```

After pushing:

1. **Re-clone everywhere.** Existing clones, including `D:\Wander`, still contain the old history and must not be pushed from.
   ```bash
   mv /d/Wander /d/Wander-old
   git clone https://github.com/dungv798/Wander.git /d/Wander
   # bring back your local-only files (never committed): .env.local, .claude/settings.local.json, .mcp.json,
   # tools/codex-mcp, tools/claude-handoff, tools/codex-skills, docs/ux/screenshots, docs/design/crops
   ```
2. **GitHub keeps old objects for a while.** Commits stay reachable by hash and through closed PR refs until GitHub garbage-collects.
   For a full purge ask GitHub Support to run a garbage collection / remove cached views, or create a new private repository and push
   the rewritten history there instead.
3. **Render.** `autoDeploy` is off; trigger a manual deploy after the push. If the service tracks `main`, it now builds the rewritten tip.
4. **Secrets are not fixed by a rewrite.** The leaked key reported in `docs/upgrade-report.md` is still in the rewritten history (it is
   in a text file). Rotate it. To drop the file as well:
   `git filter-repo --force --invert-paths --path docs/research/venue-candidates-20261107.json` in the rewritten clone, then push as above.
5. Keep the mirror backup until the rewritten repository has been used for a while.

## Rollback

Everything before the rewrite is in the mirror backup:

```bash
git clone --mirror /d/wander-backup-YYYYMMDD.git restore.git && cd restore.git
git push --mirror https://github.com/dungv798/Wander.git     # restores the exact original refs (force)
```
