serve:
	jekyll serve -w

build:
	jekyll build --baseurl "/declaration"

deploy:
	make build
	git worktree add -b deploy deploying/ origin/deploy
	rm -rf deploying/*
	cp -r _site/* deploying/
	- cd deploying/ && \
		git commit -am "Publishing" && \
		git push
	git worktree remove deploying
	git branch -d deploy
