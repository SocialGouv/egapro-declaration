serve:
	jekyll serve -w

build:
	jekyll build --baseurl "/declaration"

publish:
	make build
	git commit _site -m "building _site for publishing"
	git push
