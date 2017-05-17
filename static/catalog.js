DASHBOARDS = {
    SSL_FRACTION :
    {
        channel : "beta",
        histogram : "HTTP_PAGELOAD_IS_SSL",
        title : "Fraction of page loads that are HTTPS",
        values :        {
            0: "Insecure",
            1: "Secure"
        },
        days : 365
    }
}
