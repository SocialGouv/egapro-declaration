serve:
	jekyll serve -w

build:
	echo "sentry-dsn: 'https://b2f84ee9dc6044abbeb0f417f4335a26@sentry.fabrique.social.gouv.fr/48'" >> _config.yml
	echo "version: `date +"%Y.%m.%d"`" >> _config.yml
	jekyll build --baseurl "/declaration"
	sed -i '' -e '$$ d' _config.yml # remove the last line
	sed -i '' -e '$$ d' _config.yml

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
	git tag -f `date +"%Y.%m.%d"`-published
	git tag -f `date +"%Y.%m.%d"` origin/deploy
	git push --tags -f