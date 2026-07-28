import React from 'react'

const Home = () => {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to AutoWorkshop
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Inventory Management System
      </p>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Manage Products</h3>
          <p className="text-gray-600">Add, update, and track your inventory</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Service Records</h3>
          <p className="text-gray-600">Track customer services and billing</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Reports</h3>
          <p className="text-gray-600">View sales and inventory reports</p>
        </div>
      </div>
    </div>
  )
}

export default Home