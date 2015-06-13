test:
	@./node_modules/.bin/mocha -u tdd  --recursive --reporter spec test/spec

.PHONY: test