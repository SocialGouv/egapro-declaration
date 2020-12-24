serve:
	jekyll serve -w

build:
	JEKYLL_ENV=`date +"%Y.%m.%d"` jekyll build --baseurl "/declaration"

release: build
	git worktree add -b deploy deploying/ origin/deploy
	rm -rf deploying/*
	cp -r _site/* deploying/
	- cd deploying/ && \
		git add . && \
		git commit -am "Publishing" && \
		git push
	git worktree remove deploying
	git branch -d deploy

release-prod: release
	git tag `date +"%Y.%m.%d"` deploy
	git push --tags