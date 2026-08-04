-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "objMngNo" INTEGER NOT NULL,
    "syubetu" INTEGER NOT NULL,
    "syumoku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceMan" INTEGER NOT NULL,
    "madori" TEXT NOT NULL,
    "landMen" DOUBLE PRECISION,
    "bldMen" DOUBLE PRECISION,
    "bldStructure" TEXT,
    "bldY" INTEGER,
    "bldM" INTEGER,
    "address" TEXT NOT NULL,
    "prefCd" TEXT NOT NULL,
    "cityCd" TEXT NOT NULL,
    "elementarySchool" TEXT,
    "juniorHighSchool" TEXT,
    "currentState" TEXT,
    "disclosureLevel" INTEGER NOT NULL DEFAULT 0,
    "priceDown" BOOLEAN NOT NULL DEFAULT false,
    "reformTarget" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_objMngNo_key" ON "Property"("objMngNo");

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
