REPORTER = dot

test:
	@./node_modules/mocha/bin/mocha --reporter $(REPORTER)

test-cov: lib-cov
	@DATA_CTL_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

clean:
	rm -f coverage.html
	rm -fr lib-cov

.PHONY: test test-cov clean