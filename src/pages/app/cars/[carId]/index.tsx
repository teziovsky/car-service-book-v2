import { Car } from "@prisma/client";
import React from "react";

import Seo from "@/components/Seo";
import Layout from "@/layouts/Layout";

const Car = () => {
  const car = {} as Car;
  return (
    <Layout>
      <Seo title="Cars" description="cars list" />
      <div className="container min-h-app py-6">
        {car ? (
          <div>
            <h1>{car.brand}</h1>
          </div>
        ) : (
          <h2 className="text-3xl font-bold text-red-200">No car 🤷🏼‍♂️</h2>
        )}
      </div>
    </Layout>
  );
};

export default Car;
