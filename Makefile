test:
	@./node_modules/.bin/mocha -u tdd  --recursive --reporter spec test/spec --timeout 40000

.PHONY: test