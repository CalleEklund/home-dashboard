env "local" {
  src = "file://schema.sql"
  url = "postgres://home-dashboard:home-dashboard@localhost:5432/home-dashboard?sslmode=disable"
  dev = "docker://postgres/17/dev"

  migration {
    dir = "file://migrations"
  }
}

env "production" {
  src = "file://schema.sql"
  url = env("DATABASE_URL")

  migration {
    dir = "file://migrations"
  }
}
