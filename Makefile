serve:
	jekyll serve -w

build:
	jekyll build --baseurl "/declaration"

publish:
	make build
	npm run deploy
