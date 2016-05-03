describe("JasDriver", function() {

    it("runs tests and passes", function() {
        expect(1).toBe(1);
    });

    xit("can fail too", function() {
        expect(1).toBe(2);
    });

    describe("Second level", function() {

        it("reports property", function() {
            expect("a").not.toBe("b");
        });

    });

});
