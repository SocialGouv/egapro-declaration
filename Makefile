serve:
	jekyll serve -dw -s src

build:
	jekyll build -s src --baseurl "/declaration"

publish:
	make build
	git commit _site -m "building _site for publishing"
	git push
