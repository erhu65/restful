

exports.config = {
    db_config: {
        host: "local.bonray.com.tw",
        user: "root",
        password: "admin123",
        database: "PhotoAlbums",

        pooled_connections: 125,
        idle_timeout_millis: 30000
    },

    static_content: "static/"
};

